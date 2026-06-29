/**
 * Scene-split Handler
 *
 * Detects scene cuts in a single input video and slices it into one clip per scene, plus a
 * first-frame thumbnail per scene. Returns every clip + thumbnail as outputs (the Python wrapper
 * uploads each to `{upload.key}/{filename}` when the key is a prefix), with per-scene metadata
 * (start/end/duration/score/dimensions) attached to each output.
 *
 * Detection algorithm (ported from videoclone): a dual-pass ffmpeg `select='gt(scene,T)'` — once on
 * the full frame and once on a centre crop (catches subject-only changes) — with the cut times parsed
 * out of ffmpeg's stderr, then non-maximum suppression to dedupe near-coincident cuts.
 *
 * Unlike videoclone (which targets Seedance) we do NOT stretch sub-250ms scenes and do NOT error on a
 * single continuous shot — a cut-less video yields one scene spanning the whole clip. Downscaling is
 * opt-in (omit `options.downscale` to keep source resolution).
 */

import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { z } from "zod";
import { IHandlerResponse } from "../types";
import { runcmd } from "../utils";

const fsPath = process.env.FS_PATH || ".";
const bin = process.env.FFMPEG_PATH || "";
const FFMPEG = `${bin}ffmpeg`;
const FFPROBE = `${bin}ffprobe`;

// ============================================================================
// Schema
// ============================================================================

export const sceneSplitSchema = z.object({
  inputs: z.array(z.object({ url: z.string() })).length(1),
  options: z
    .object({
      /** select='gt(scene,T)' sensitivity — below ffmpeg's 0.3 default to catch subtle cuts. */
      threshold: z.number().default(0.15),
      /** Non-maximum-suppression window (seconds): drop cuts closer than this + frame-0 phantoms. */
      suppression: z.number().default(0.07),
      /** Run a second detection pass on a centre crop to catch subject-only changes. */
      cropPass: z.boolean().default(true),
      /** Centre-crop fraction for the crop pass. */
      cropFactor: z.number().default(0.6),
      /** Intervals shorter than this (seconds) are merged into a neighbour (false-cut floor). */
      minSceneDuration: z.number().default(0.4),
      /** Safety cap; if exceeded keep the highest-scoring scenes. */
      maxScenes: z.number().int().default(20),
      /** Thumbnail width (height auto, even). */
      thumbnailWidth: z.number().int().default(640),
      /** Opt-in downscale of the cut clips. Omit to keep source resolution. */
      downscale: z
        .object({
          maxLongEdge: z.number().int(),
          maxShortEdge: z.number().int(),
        })
        .optional(),
    })
    .default({}),
});

type SceneSplitConfig = z.infer<typeof sceneSplitSchema>;
type SceneSplitOptions = SceneSplitConfig["options"];

interface Cut {
  time: number;
  score: number;
}
interface Interval {
  start: number;
  end: number;
  score: number;
}

// ============================================================================
// Helpers
// ============================================================================

/** exec a command capturing stdout+stderr (ffmpeg writes detection metadata to stderr). */
function execCapture(cmd: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    exec(cmd, { maxBuffer: 1024 * 1024 * 128 }, (error, stdout, stderr) => {
      if (error) reject(new Error(`${cmd}\n${stderr || error.message}`));
      else resolve({ stdout, stderr });
    });
  });
}

async function downloadInput(url: string, dir: string): Promise<string> {
  await fs.promises.mkdir(dir, { recursive: true });
  const extension = url.split(".").pop()?.split("?")[0] || "mp4";
  const inputPath = `${dir}/input_0.${extension}`;
  await runcmd(`wget -O "${inputPath}" "${url}"`);
  return inputPath;
}

async function probe(
  inputPath: string,
): Promise<{ durationSeconds: number; width: number; height: number }> {
  const { stdout } = await execCapture(
    `${FFPROBE} -v error -select_streams v:0 -show_entries stream=width,height:format=duration -of json "${inputPath}"`,
  );
  const json = JSON.parse(stdout) as {
    streams?: { width?: number; height?: number }[];
    format?: { duration?: string };
  };
  const stream = json.streams?.[0] ?? {};
  return {
    durationSeconds: Number(json.format?.duration ?? 0),
    width: Number(stream.width ?? 0),
    height: Number(stream.height ?? 0),
  };
}

/** Run a single detection pass and parse `pts_time` / `lavfi.scene_score` pairs from stderr. */
async function detectCuts(
  inputPath: string,
  threshold: number,
  cropFilter: string | null,
): Promise<Cut[]> {
  const vf = `${cropFilter ? cropFilter + "," : ""}select='gt(scene,${threshold})',metadata=print`;
  const { stderr } = await execCapture(
    `${FFMPEG} -hide_banner -nostats -i "${inputPath}" -filter:v "${vf}" -an -f null -`,
  );

  const cuts: Cut[] = [];
  let pendingTime: number | null = null;
  for (const line of stderr.split("\n")) {
    const t = line.match(/pts_time:([\d.]+)/);
    if (t) {
      pendingTime = Number(t[1]);
      continue;
    }
    const s = line.match(/lavfi\.scene_score=([\d.]+)/);
    if (s && pendingTime !== null) {
      cuts.push({ time: pendingTime, score: Number(s[1]) });
      pendingTime = null;
    }
  }
  return cuts;
}

/** Non-maximum suppression dedupe of full-frame + crop-frame cuts (ported from videoclone). */
function dedupeCuts(
  full: Cut[],
  crop: Cut[],
  totalDuration: number,
  suppression: number,
): Cut[] {
  const novelCrop = crop.filter((c) =>
    full.every((f) => Math.abs(f.time - c.time) > suppression),
  );
  const ranked = [...full, ...novelCrop]
    .filter((c) => c.time > 0 && c.time < totalDuration)
    .sort((a, b) => {
      const bucketA = Math.floor(a.score / 0.05);
      const bucketB = Math.floor(b.score / 0.05);
      if (bucketA !== bucketB) return bucketB - bucketA;
      return a.time - b.time;
    });

  const accepted: Cut[] = [];
  for (const cut of ranked) {
    if (accepted.every((a) => Math.abs(a.time - cut.time) > suppression)) {
      accepted.push(cut);
    }
  }
  return accepted
    .filter((c) => c.time >= suppression)
    .sort((a, b) => a.time - b.time);
}

/** Build scene intervals from accepted cuts; merge sub-min scenes; cap to maxScenes by score. */
function buildIntervals(
  cuts: Cut[],
  totalDuration: number,
  minSceneDuration: number,
  maxScenes: number,
): Interval[] {
  const raw: Interval[] = [];
  let prev = 0;
  let prevScore = 0;
  for (const cut of cuts) {
    raw.push({ start: prev, end: cut.time, score: prevScore });
    prev = cut.time;
    prevScore = cut.score;
  }
  raw.push({ start: prev, end: totalDuration, score: prevScore });

  // Merge intervals shorter than the floor into the previous one.
  const merged: Interval[] = [];
  for (const iv of raw) {
    const dur = iv.end - iv.start;
    if (dur >= minSceneDuration || merged.length === 0) {
      merged.push({ ...iv });
    } else {
      merged[merged.length - 1].end = iv.end;
    }
  }
  // If the first interval is still short, fold it into the second.
  if (
    merged.length >= 2 &&
    merged[0].end - merged[0].start < minSceneDuration
  ) {
    merged[1].start = merged[0].start;
    merged.shift();
  }

  if (merged.length <= maxScenes) return merged;
  return [...merged]
    .sort((a, b) => b.score - a.score)
    .slice(0, maxScenes)
    .sort((a, b) => a.start - b.start);
}

function ensureEven(n: number): number {
  const f = Math.max(2, Math.floor(n));
  return f % 2 === 0 ? f : f - 1;
}

/** Even-floored downscale target, capping both edges; never upscales. Null ⇒ keep source dims. */
function targetDims(
  width: number,
  height: number,
  downscale: SceneSplitOptions["downscale"],
): { width: number; height: number } {
  if (!downscale) return { width: ensureEven(width), height: ensureEven(height) };
  const longEdge = Math.max(width, height);
  const shortEdge = Math.min(width, height);
  const scale = Math.min(
    1,
    downscale.maxLongEdge / longEdge,
    downscale.maxShortEdge / shortEdge,
  );
  return { width: ensureEven(width * scale), height: ensureEven(height * scale) };
}

function pad3(n: number): string {
  return String(n).padStart(3, "0");
}

// ============================================================================
// Main Process Handler
// ============================================================================

export const processHandler = async (
  body: SceneSplitConfig,
): Promise<IHandlerResponse> => {
  const stamp = Date.now();
  const inputTempDir = `${fsPath}/tmp/scene-split-in_${stamp}`;
  const outDir = `${fsPath}/tmp/scene-split-out_${stamp}`;

  try {
    const opts = body.options;
    const inputPath = await downloadInput(body.inputs[0].url, inputTempDir);
    await fs.promises.mkdir(outDir, { recursive: true });

    const info = await probe(inputPath);
    if (!info.durationSeconds || !info.width || !info.height) {
      throw new Error("Could not probe input video (duration/dimensions).");
    }

    // Dual-pass detection → dedupe → intervals.
    const full = await detectCuts(inputPath, opts.threshold, null);
    const crop = opts.cropPass
      ? await detectCuts(
          inputPath,
          opts.threshold,
          `crop=iw*${opts.cropFactor}:ih*${opts.cropFactor}`,
        )
      : [];
    const cuts = dedupeCuts(full, crop, info.durationSeconds, opts.suppression);
    const intervals = buildIntervals(
      cuts,
      info.durationSeconds,
      opts.minSceneDuration,
      opts.maxScenes,
    );

    const dims = targetDims(info.width, info.height, opts.downscale);
    const scaleArg = opts.downscale ? ` -vf "scale=${dims.width}:${dims.height}"` : "";

    const outputs: Record<string, unknown>[] = [];
    for (let i = 0; i < intervals.length; i++) {
      const iv = intervals[i];
      const clipName = `scene-${pad3(i)}.mp4`;
      const thumbName = `scene-${pad3(i)}.jpg`;
      const clipPath = `${outDir}/${clipName}`;
      const thumbPath = `${outDir}/${thumbName}`;
      const start = iv.start.toFixed(4);
      const end = Math.max(iv.start, iv.end - 0.001).toFixed(4);

      // Output-seek (-ss/-to after -i) for frame accuracy.
      await execCapture(
        `${FFMPEG} -y -hide_banner -nostats -i "${inputPath}" -ss ${start} -to ${end}${scaleArg} ` +
          `-c:v libx264 -preset veryfast -crf 23 -an -pix_fmt yuv420p -movflags +faststart -reset_timestamps 1 "${clipPath}"`,
      );
      await execCapture(
        `${FFMPEG} -y -hide_banner -nostats -ss ${start} -i "${inputPath}" -frames:v 1 -q:v 3 -vf "scale=${opts.thumbnailWidth}:-2" "${thumbPath}"`,
      );

      outputs.push({
        filename: clipName,
        path: clipPath,
        sceneIndex: i,
        role: "clip",
        start: iv.start,
        end: iv.end,
        duration: iv.end - iv.start,
        score: iv.score,
        width: dims.width,
        height: dims.height,
      });
      outputs.push({
        filename: thumbName,
        path: thumbPath,
        sceneIndex: i,
        role: "thumb",
      });
    }

    return { status: 200, data: { outputs } };
  } catch (error) {
    console.log("Error processing scene-split");
    console.log(error);
    return {
      status: 400,
      data: { error: error.message || "Error processing scene-split" },
    };
  } finally {
    try {
      await runcmd(`rm -rf ${inputTempDir}`);
    } catch (cleanupError) {
      console.log("Warning: failed to clean up scene-split input dir:", cleanupError);
    }
  }
};
