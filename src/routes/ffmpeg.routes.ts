import path from "path";
import { z } from "zod";
import express, { Request, Response } from "express";
import { validateRequest } from "middlewares/req-validator";
import { runcmd } from "utils/app";

export const ffmpegRoutes = express.Router();

const fsPath = process.env.FS_PATH || ".";
const ffmpegPath = process.env.FFMPEG_PATH || "";

const processSchema = z.object({
  chainCmds: z.array(z.string()),
  filterCmds: z.array(z.string()),
  output: z.string().optional(),
  createDir: z.boolean().optional(),
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
  threads: z.number().optional(),
});

ffmpegRoutes.post(`/process`, validateRequest(processSchema), async (req: Request, res: Response) => {
  try {
    const { chainCmds, filterCmds, output, createDir = true } = req.body as z.infer<typeof processSchema>;
    let cmd = `cd ${fsPath} && ${ffmpegPath}ffmpeg -y`;

    if (chainCmds.length > 0) {
      cmd += ` ${chainCmds.join(" ")}`;
    }
    if (filterCmds.length > 0) {
      cmd += ` -vf "${filterCmds.join(", ")}"`;
    }
    if (createDir && output) {
      await runcmd(`mkdir -p ${output.split("/").slice(0, -1).join("/")}`);
    }
    if (output) {
      cmd += ` ${output}`;
    }
    const data = await runcmd(cmd);
    res.status(200).json({ data });
  } catch (error) {
    res.status(400).json({ error });
  }
});

ffmpegRoutes.post(`/probe`, validateRequest(probeSchema), async (req: Request, res: Response) => {
  try {
    const { input, chainCmds } = req.body as z.infer<typeof probeSchema>;
    let cmd = `cd ${fsPath} && ${ffmpegPath}ffprobe`;

    if (chainCmds.length > 0) {
      cmd += ` ${chainCmds.join(" ")}`;
    }
    cmd += ` ${input}`;
    const data = await runcmd(cmd);
    res.status(200).json({ data });
  } catch (error) {
    res.status(400).json({ error });
  }
});

ffmpegRoutes.post(`/vmaf`, validateRequest(vmafSchema), async (req: Request, res: Response) => {
  try {
    const { input1, input2, scale, model, threads = 8 } = req.body as z.infer<typeof vmafSchema>;
    let cmd = `cd ${fsPath} && ${ffmpegPath}ffmpeg`;
    const modelPath = path.join(__dirname, "..", "models", `${model}.json`);
    cmd += ` -i ${input1} -i ${input2} -lavfi "[0:v]${scale}:flags=bicubic[distorted];[1:v]${scale}:flags=bicubic[reference];[distorted][reference]libvmaf=model='path=${modelPath}':n_subsample=10:n_threads=${threads}" -f null -`;
    const data = await runcmd(cmd);
    const score = Math.floor(parseFloat(data.split("VMAF score:")[1]));
    res.status(200).json({ data: isNaN(score) ? 0 : score });
  } catch (error) {
    res.status(400).json({ error });
  }
});
