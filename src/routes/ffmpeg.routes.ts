import path from "path";
import fs from "fs";
import { z } from "zod";
import express, { Request, Response } from "express";
import { validateRequest } from "middlewares/req-validator";
import { runcmd } from "utils/app";
import cuid2 from "@paralleldrive/cuid2";
import { sendWebhook } from "utils/webhook";
import { WebhookType } from "types";

export const ffmpegRoutes = express.Router();

const fsPath = process.env.FS_PATH || ".";
const ffmpegPath = process.env.FFMPEG_PATH || "";

const processSchema = z.object({
  input: z.string().optional(),
  chainCmds: z.array(z.string()).optional(),
  filterCmds: z.array(z.string()).optional(),
  cmdString: z.string().optional(),
  output: z.string().optional(),
});

const processScheduleSchema = processSchema.extend({
  async: z.boolean().optional(),
  callbackId: z.string().optional(),
  callbackUrl: z.string(),
  callbackMeta: z.record(z.any()).optional(),
});

const probeSchema = z.object({
  input: z.string(),
  chainCmds: z.array(z.string()),
});

const vmafSchema = z.object({
  input1: z.string(),
  input2: z.string(),
  scale: z.string(),
  model: z.string(),
  subsample: z.number().optional(),
  threads: z.number().optional(),
});

const runProcess = async (payload: {
  input?: string;
  chainCmds?: string[];
  filterCmds?: string[];
  cmdString?: string;
  output?: string;
}) => {
  const { input, chainCmds, filterCmds, cmdString, output } = payload;

  let cmd = `${ffmpegPath}ffmpeg -y`;
  if (input) {
    cmd += ` -i ${fsPath}/${input}`;
  }
  if (chainCmds && chainCmds.length > 0) {
    chainCmds.forEach((chainCmd) => {
      const [key, value] = chainCmd.split(" ");
      if (key === "-i" || key === "-passlogfile") {
        cmd += ` ${key} ${fsPath}/${value}`;
      } else {
        cmd += ` ${chainCmd}`;
      }
    });
  }
  if (filterCmds && filterCmds.length > 0) {
    cmd += ` -vf "${filterCmds.join(", ")}"`;
  }
  if (cmdString) {
    cmd += ` ${cmdString}`;
  }
  if (output) {
    await fs.promises.mkdir(`${fsPath}/${output.split("/").slice(0, -1).join("/")}`, { recursive: true });
    cmd += ` ${fsPath}/${output}`;
  }
  return runcmd(cmd);
};

ffmpegRoutes.post(`/process`, validateRequest(processSchema), async (req: Request, res: Response) => {
  const { input, chainCmds, filterCmds, cmdString, output } = req.body as z.infer<typeof processSchema>;

  try {
    const data = await runProcess({ input, chainCmds, filterCmds, cmdString, output });
    res.status(200).json({ data });
  } catch (error) {
    res.status(400).send(error.message);
  }
});

ffmpegRoutes.post(`/process/schedule`, validateRequest(processScheduleSchema), async (req: Request, res: Response) => {
  const {
    input,
    chainCmds,
    filterCmds,
    cmdString,
    output,
    async,
    callbackId = cuid2.createId(),
    callbackUrl,
    callbackMeta = {},
  } = req.body as z.infer<typeof processScheduleSchema>;

  try {
    if (async) {
      res.status(200).json({ callbackId });
    }
    const data = await runProcess({ input, chainCmds, filterCmds, cmdString, output });
    await sendWebhook(callbackUrl, { callbackId, callbackMeta, type: WebhookType.FFMPEG, success: true, data });

    if (!async) {
      res.status(200).json({ data });
    }
  } catch (error) {
    await sendWebhook(callbackUrl, {
      callbackId,
      callbackMeta,
      type: WebhookType.FFMPEG,
      success: false,
      data: error.message,
    });

    if (!async) {
      res.status(400).send(error.message);
    }
  }
});

ffmpegRoutes.post(`/probe`, validateRequest(probeSchema), async (req: Request, res: Response) => {
  try {
    const { input, chainCmds } = req.body as z.infer<typeof probeSchema>;
    let cmd = `${ffmpegPath}ffprobe`;

    if (chainCmds.length > 0) {
      cmd += ` ${chainCmds.join(" ")}`;
    }
    cmd += ` ${fsPath}/${input}`;
    const data = await runcmd(cmd);
    res.status(200).json({ data });
  } catch (error) {
    res.status(400).send(error.message);
  }
});

ffmpegRoutes.post(`/vmaf`, validateRequest(vmafSchema), async (req: Request, res: Response) => {
  try {
    const { input1, input2, scale, model, subsample = 10, threads = 8 } = req.body as z.infer<typeof vmafSchema>;

    let cmd = `${ffmpegPath}ffmpeg`;
    const modelPath = path.join(__dirname, "..", "models", `${model}.json`);

    cmd += ` -i ${fsPath}/${input1} -i ${fsPath}/${input2} -lavfi "[0:v]${scale}:flags=bicubic,setpts=PTS-STARTPTS[distorted];[1:v]${scale}:flags=bicubic,setpts=PTS-STARTPTS[reference];[distorted][reference]libvmaf=model='path=${modelPath}':n_subsample=${subsample}:n_threads=${threads}" -f null -`;
    const data = await runcmd(cmd);
    let score = Math.floor(parseFloat(data.split("VMAF score:")[1]));
    score = isNaN(score) ? 0 : score;

    res.status(200).json({ score });
  } catch (error) {
    res.status(400).send(error.message);
  }
});
