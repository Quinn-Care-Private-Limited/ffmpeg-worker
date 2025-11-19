/**
 * Canvas Video Handler
 * 
 * This module handles rendering canvas animations to video files using Puppeteer and FFmpeg.
 * 
 * Features:
 * - Renders canvas animations from JSON configuration
 * - Captures frames using headless browser
 * - Combines frames into video using FFmpeg
 * - Supports multiple audio tracks with trimming, fade effects, and volume control
 * - Automatically downloads and processes audio files
 * - Cleans up temporary files after processing
 */

import path from "path";
import puppeteer from "puppeteer";
import { IHandlerResponse } from "types";
import fs from "fs";
import { z } from "zod";
import { createServer } from "http";
import { runcmd, runProcess } from "utils";

let window: any;
let fileServerStarted = false;
const fsPath = process.env.FS_PATH || ".";

// ============================================================================
// Types and Schemas
// ============================================================================

const audioConfigSchema = z.object({
  url: z.string(),
  startTime: z.number().min(0).optional(),
  endTime: z.number().optional(),
  fadeIn: z.number().min(0).optional(),
  fadeOut: z.number().min(0).optional(),
  volume: z.number().min(0).max(2).optional(),
});

export const processSchema = z.object({
  json: z.object({}),
  startTime: z.number().min(0),
  endTime: z.number().min(0),
  fps: z.number().min(0).optional(),
  vfi: z.number().min(0).max(60).optional(),
  crf: z.number().min(0).max(51).optional(),
  output: z.string(),
  audio: z.array(audioConfigSchema).optional(),
});

type AudioConfig = z.infer<typeof audioConfigSchema>;
type ProcessConfig = z.infer<typeof processSchema>;

// ============================================================================
// File Server Configuration
// ============================================================================

const types: Record<string, string> = {
  html: "text/html",
  js: "application/javascript",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  mp4: "video/mp4",
};

const port = 5500;
const host = `http://127.0.0.1:${port}`;

const fileServer = createServer((req: any, res: any) => {
  if (req.url == "/.well-known/appspecific/com.chrome.devtools.json") {
    res.writeHead(204, { "Content-Type": "text/html" });
    res.end();
    return;
  }

  const filePath = `${fsPath}${req.url.replace(host, "")}`;
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  const extension = path.extname(req.url).slice(1);
  const type = types[extension];

  if (range && type === "video/mp4") {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });

    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": type,
      "Access-Control-Allow-Origin": "*",
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/html" });
        res.end("404: File not found");
      } else {
        res.writeHead(200, {
          "Content-Type": type,
          "Content-Length": fileSize,
          "Accept-Ranges": "bytes",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(data);
      }
    });
  }
});

const listenServer = () =>
  new Promise((resolve, reject) => {
    fileServer.listen(port, () => {
      resolve(true);
      fileServerStarted = true;
      console.log("File server started");
    });
  });

const closeServer = () =>
  new Promise((resolve, reject) => {
    fileServer.close(() => {
      resolve(true);
    });
  });

listenServer();

// ============================================================================
// Audio Processing Helpers
// ============================================================================

/**
 * Downloads audio files from URLs to a temporary directory
 */
async function downloadAudioFiles(
  audioConfigs: AudioConfig[],
  audioTempDir: string
): Promise<string[]> {
  await fs.promises.mkdir(audioTempDir, { recursive: true });
  const audioPaths: string[] = [];

  for (let i = 0; i < audioConfigs.length; i++) {
    const audioConfig = audioConfigs[i];
    const extension = audioConfig.url.split('.').pop()?.split('?')[0] || 'mp3';
    const audioPath = `${audioTempDir}/audio_${i}.${extension}`;
    
    console.log(`Downloading audio ${i + 1}/${audioConfigs.length} from ${audioConfig.url}...`);
    try {
      await runcmd(`wget -O "${audioPath}" "${audioConfig.url}"`);
      audioPaths.push(audioPath);
    } catch (error) {
      console.log(`Warning: Failed to download audio ${i + 1}:`, error);
    }
  }

  return audioPaths;
}

/**
 * Builds audio filter chain for a single audio track
 */
function buildAudioFilterChain(
  audioConfig: AudioConfig,
  inputIndex: number,
  videoDuration: number
): string[] {
  const filters: string[] = [];

  // Apply trim if specified
  if (audioConfig.startTime !== undefined || audioConfig.endTime !== undefined) {
    const trimStart = audioConfig.startTime || 0;
    const trimEnd = audioConfig.endTime !== undefined ? `:end=${audioConfig.endTime}` : '';
    filters.push(`atrim=start=${trimStart}${trimEnd}`);
    filters.push(`asetpts=PTS-STARTPTS`);
  }

  // Apply fade in
  if (audioConfig.fadeIn && audioConfig.fadeIn > 0) {
    filters.push(`afade=t=in:st=0:d=${audioConfig.fadeIn}`);
  }

  // Apply fade out
  if (audioConfig.fadeOut && audioConfig.fadeOut > 0) {
    const fadeOutStart = audioConfig.endTime 
      ? audioConfig.endTime - audioConfig.fadeOut 
      : videoDuration - audioConfig.fadeOut;
    filters.push(`afade=t=out:st=${fadeOutStart}:d=${audioConfig.fadeOut}`);
  }

  // Apply volume adjustment
  const volume = audioConfig.volume !== undefined ? audioConfig.volume : 1.0;
  if (volume !== 1.0) {
    filters.push(`volume=${volume}`);
  }

  return filters;
}

/**
 * Builds complete FFmpeg filter complex for all audio tracks
 */
function buildAudioFilterComplex(
  audioConfigs: AudioConfig[],
  audioPaths: string[],
  videoDuration: number
): { audioFilters: string[]; finalAudioLabel: string; audioLabels: string[] } {
  const audioFilters: string[] = [];
  const audioLabels: string[] = [];

  // Build filter for each audio track
  for (let i = 0; i < audioPaths.length; i++) {
    const audioConfig = audioConfigs[i];
    const inputIndex = i + 1; // +1 because video is input 0
    const audioLabel = `a${i}`;
    audioLabels.push(`[${audioLabel}]`);

    const filters = buildAudioFilterChain(audioConfig, inputIndex, videoDuration);

    if (filters.length > 0) {
      const filterChain = `[${inputIndex}:a]${filters.join(',')}[${audioLabel}]`;
      audioFilters.push(filterChain);
    } else {
      audioFilters.push(`[${inputIndex}:a]${audioLabel}`);
    }
  }

  // Mix multiple audio streams if needed
  let finalAudioLabel = '';
  if (audioLabels.length > 1) {
    finalAudioLabel = 'mixed';
    audioFilters.push(
      `${audioLabels.join('')}amix=inputs=${audioLabels.length}:duration=longest[${finalAudioLabel}]`
    );
  } else if (audioLabels.length === 1) {
    finalAudioLabel = 'a0';
  }

  return { audioFilters, finalAudioLabel, audioLabels };
}

/**
 * Builds FFmpeg command arguments for video with audio
 */
function buildFFmpegCommandWithAudio(
  config: {
    tempFramesDir: string;
    fps: number;
    width: number;
    height: number;
    vfi?: number;
    crf: number;
  },
  audioPaths: string[],
  audioFilterData: { audioFilters: string[]; finalAudioLabel: string }
): string[] {
  const { tempFramesDir, fps, width, height, vfi, crf } = config;
  const { audioFilters, finalAudioLabel } = audioFilterData;

  const ffmpegChainCmds: string[] = [
    `-framerate ${fps}`,
    `-i ${tempFramesDir.replace(`${fsPath}/`, "")}/frame_%05d.jpg`,
  ];

  // Add audio inputs
  for (const audioPath of audioPaths) {
    ffmpegChainCmds.push(`-i ${audioPath.replace(`${fsPath}/`, "")}`);
  }

  // Build filter complex
  const videoFilter = `[0:v]scale=${width}:${height}:force_original_aspect_ratio=disable${vfi ? `,minterpolate=fps=${vfi}` : ''}[v]`;
  const filterComplex = [videoFilter, ...audioFilters].join(';');

  ffmpegChainCmds.push(`-filter_complex "${filterComplex}"`);
  ffmpegChainCmds.push(`-map "[v]"`);
  
  if (finalAudioLabel) {
    ffmpegChainCmds.push(`-map "[${finalAudioLabel}]"`);
  }

  ffmpegChainCmds.push(`-c:v libx264`);
  ffmpegChainCmds.push(`-c:a aac`);
  ffmpegChainCmds.push(`-b:a 192k`);
  ffmpegChainCmds.push(`-preset ultrafast`);
  ffmpegChainCmds.push(`-pix_fmt yuv420p`);
  ffmpegChainCmds.push(`-crf ${crf}`);

  return ffmpegChainCmds;
}

/**
 * Builds FFmpeg command arguments for video without audio
 */
function buildFFmpegCommandWithoutAudio(config: {
  tempFramesDir: string;
  fps: number;
  width: number;
  height: number;
  vfi?: number;
  crf: number;
}): string[] {
  const { tempFramesDir, fps, width, height, vfi, crf } = config;

  return [
    `-framerate ${fps}`,
    `-i ${tempFramesDir.replace(`${fsPath}/`, "")}/frame_%05d.jpg`,
    `-vf scale=${width}:${height}:force_original_aspect_ratio=disable${vfi ? `,minterpolate=fps=${vfi}` : ''}`,
    `-c:v libx264`,
    `-preset ultrafast`,
    `-pix_fmt yuv420p`,
    `-crf ${crf}`,
  ];
}

/**
 * Generates final video using FFmpeg with optional audio
 */
async function generateVideoWithFFmpeg(
  body: ProcessConfig,
  json: any,
  tempFramesDir: string,
  fps: number,
  totalFrames: number
): Promise<void> {
  console.log(`Creating video from frames...`);
  console.log(
    `Using parameters: fps=${fps}, totalFrames=${totalFrames}, duration=${body.endTime - body.startTime}s`,
  );

  const safeFps = !fps || fps <= 0 ? 30 : fps;
  const videoDuration = body.endTime - body.startTime;
  const audioTempDir = `${fsPath}/tmp/audio_${Date.now()}`;

  let ffmpegChainCmds: string[];
  let audioPaths: string[] = [];

  try {
    if (body.audio && body.audio.length > 0) {
      // Process with audio
      console.log(`Processing ${body.audio.length} audio file(s)...`);
      audioPaths = await downloadAudioFiles(body.audio, audioTempDir);

      if (audioPaths.length > 0) {
        const audioFilterData = buildAudioFilterComplex(body.audio, audioPaths, videoDuration);
        ffmpegChainCmds = buildFFmpegCommandWithAudio(
          {
            tempFramesDir,
            fps: safeFps,
            width: json.dimensions.width,
            height: json.dimensions.height,
            vfi: body.vfi,
            crf: body.crf || 19,
          },
          audioPaths,
          audioFilterData
        );
      } else {
        // Fallback to no audio if downloads failed
        console.log('No audio files downloaded successfully, creating video without audio');
        ffmpegChainCmds = buildFFmpegCommandWithoutAudio({
          tempFramesDir,
          fps: safeFps,
          width: json.dimensions.width,
          height: json.dimensions.height,
          vfi: body.vfi,
          crf: body.crf || 19,
        });
      }
    } else {
      // No audio
      ffmpegChainCmds = buildFFmpegCommandWithoutAudio({
        tempFramesDir,
        fps: safeFps,
        width: json.dimensions.width,
        height: json.dimensions.height,
        vfi: body.vfi,
        crf: body.crf || 19,
      });
    }

    await runProcess({
      chainCmds: ffmpegChainCmds,
      output: body.output,
    });

    console.log(`Video creation completed`);
  } finally {
    // Clean up audio files
    if (audioPaths.length > 0) {
      try {
        await runcmd(`rm -rf ${audioTempDir}`);
        console.log(`Temporary audio files cleaned up`);
      } catch (cleanupError) {
        console.log(`Warning: Failed to clean up temporary audio files:`, cleanupError);
      }
    }
  }
}

// ============================================================================
// Frame Processing Helpers
// ============================================================================

/**
 * Waits for the file server to be ready
 */
async function waitForFileServer(): Promise<void> {
  let retries = 0;
  while (!fileServerStarted) {
    if (retries >= 10) {
      throw new Error("File server failed to start");
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
    retries++;
  }
}

/**
 * Logs system information for debugging
 */
function logSystemInfo(totalDuration: number, fps: number): void {
  console.log(`Starting frame capture`);
  console.log(`CPU cores: ${require("os").cpus().length}`);
  const memUsage = process.memoryUsage();
  console.log(
    `Memory usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB heap, ${Math.round(
      memUsage.rss / 1024 / 1024,
    )}MB RSS`,
  );
  console.log(
    `Processing ${totalDuration} seconds of content at ${fps} fps (expected ${Math.ceil(
      totalDuration * fps,
    )} frames)`,
  );
}

/**
 * Processes source URLs in JSON config to use local file server
 */
function processSourceUrls(json: any, host: string): void {
  for (let i = 0; i < json.nodes.length; i++) {
    const config = json.nodes[i].config as { src: string };
    if (!(config.src.startsWith("https://") || config.src.startsWith("http://"))) {
      json.nodes[i].config.src = `${host}/${json.nodes[i].config.src}`;
    }
  }
}

/**
 * Sets up and configures a browser page for canvas rendering
 */
async function setupBrowserPage(browser: any, json: any): Promise<any> {
  const page = await browser.newPage();

  // Enable console log from the browser
  if (process.env.NODE_ENV == "development") {
    page.on("console", (msg: any) => console.log("Browser log:", msg.text()));
  }

  await page.setViewport({
    width: json.dimensions.width,
    height: json.dimensions.height,
    deviceScaleFactor: 1,
  });

  // Set page timeout
  page.setDefaultNavigationTimeout(0);
  page.setDefaultTimeout(0);

  // Enable request interception for better performance
  await page.setRequestInterception(true);
  page.on("request", (request: any) => {
    if (
      request.resourceType() === "image" ||
      request.resourceType() === "stylesheet" ||
      request.resourceType() === "font"
    ) {
      request.abort();
    } else {
      request.continue();
    }
  });

  return page;
}

/**
 * Initializes the canvas on the page
 */
async function initializeCanvas(page: any, json: any): Promise<void> {
  await page.goto(`${host}/index.html`);
  await page.addScriptTag({ url: `${host}/bundle.min.js` });
  await page.waitForFunction(() => window.processCanvas);
  await page.evaluate((json: any) => window.initCanvas(json), json);
  await page.waitForFunction(
    () => {
      return new Promise((resolve) => {
        if (window.canvas) {
          resolve(true);
        } else {
          setTimeout(() => resolve(false), 100);
        }
      });
    },
    { timeout: 10000 },
  );
}

/**
 * Captures frames from the browser canvas
 */
async function captureFrames(
  page: any,
  startTime: number,
  endTime: number,
  fps: number,
  tempFramesDir: string,
  totalFramesOffset: number
): Promise<number> {
  const startProcessTime = Date.now();

  const frames = await page.evaluate(
    (start: number, end: number, fps: number) => window.processCanvas(start, end, fps),
    startTime,
    endTime,
    fps
  );

  console.log(`Captured ${frames.length} frames in ${(Date.now() - startProcessTime) / 1000}s`);

  // Process frames in parallel batches to avoid memory issues
  for (let i = 0; i < frames.length; i += 6) {
    const batchPromises = [];
    for (let j = 0; j < 6 && i + j < frames.length; j++) {
      const frameNumber = i + j + totalFramesOffset;
      const base64Data = frames[i + j].replace(/^data:image\/jpeg;base64,/, "");
      const framePath = `${tempFramesDir}/frame_${frameNumber.toString().padStart(5, "0")}.jpg`;
      batchPromises.push(fs.promises.writeFile(framePath, base64Data, "base64"));
    }
    await Promise.all(batchPromises);
  }

  console.log(`Wrote batch frames to efs: from ${startTime}s to ${endTime}s`);
  return frames.length;
}

// ============================================================================
// Browser Configuration
// ============================================================================

/**
 * Gets Puppeteer browser launch configuration
 */
function getBrowserConfig() {
  return {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-web-security",
      "--disable-features=IsolateOrigins,site-per-process",
    ],
    protocolTimeout: 6000_000,
    timeout: 0,
  };
}

// ============================================================================
// Main Process Handler
// ============================================================================

export const processHandler = async (body: ProcessConfig): Promise<IHandlerResponse> => {
  const browser = await puppeteer.launch(getBrowserConfig());

  try {
    // Wait for file server to be ready
    await waitForFileServer();

    // Process JSON configuration
    const json = body.json as any;
    processSourceUrls(json, host);

    // Setup browser page and initialize canvas
    const page = await setupBrowserPage(browser, json);
    await initializeCanvas(page, json);

    // Prepare directories
    const tempFramesDir = `${fsPath}/tmp/frames_${Date.now()}`;
    await fs.promises.mkdir(tempFramesDir, { recursive: true });

    const outputDir = path.dirname(`${fsPath}/${body.output}`);
    if (!fs.existsSync(outputDir)) {
      await fs.promises.mkdir(outputDir, { recursive: true });
    }

    // Calculate frame capture parameters
    const fps = body.fps || 15;
    const totalDuration = body.endTime - body.startTime;
    const secondsPerBatch = totalDuration <= 1 ? totalDuration : 1;

    let start = body.startTime;
    let end = Math.min(start + secondsPerBatch, body.endTime);
    let totalFrames = 0;

    // Log system information
    logSystemInfo(totalDuration, fps);

    // Capture frames in batches
    while (start < body.endTime) {
      console.log(`Processing batch: ${start}s to ${end}s`);
      const capturedFrames = await captureFrames(page, start, end, fps, tempFramesDir, totalFrames);
      totalFrames += capturedFrames;
      start = end;
      end = Math.min(start + secondsPerBatch, body.endTime);
    }

    await browser.close();
    console.log(`Frame capture finished`, { frames: totalFrames });

    // Generate video with FFmpeg
    await generateVideoWithFFmpeg(body, json, tempFramesDir, fps, totalFrames);

    // Clean up temp frames
    try {
      await runcmd(`rm -rf ${tempFramesDir}`);
      console.log(`Temporary frames cleaned up`);
    } catch (cleanupError) {
      console.log(`Warning: Failed to clean up temporary frames:`, cleanupError);
    }

    return {
      status: 200,
      data: {
        output: `${fsPath}/${body.output}`,
      },
    };
  } catch (error) {
    console.log(`Error processing canvas`);
    console.log(error);
    await browser.close();
    return {
      status: 400,
      data: {
        error: "Error processing canvas",
      },
    };
  }
};