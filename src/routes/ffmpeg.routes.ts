import path from "path";
import { z } from "zod";
import express, { Request, Response } from "express";
import { validateRequest } from "middlewares/req-validator";
import { runcmd } from "utils/app";
import cuid2 from "@paralleldrive/cuid2";
import axios, { AxiosError } from "axios";

export const ffmpegRoutes = express.Router();

const fsPath = process.env.FS_PATH || ".";
const ffmpegPath = process.env.FFMPEG_PATH || "";

const processSchema = z.object({
  chainCmds: z.array(z.string()).optional(),
  filterCmds: z.array(z.string()).optional(),
  input: z.string().optional(),
  output: z.string().optional(),
  createDir: z.boolean().optional(),
  callbackId: z.string().optional(),
  callbackUrl: z.string().optional(),
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
  callbackId: z.string().optional(),
  callbackUrl: z.string().optional(),
});

ffmpegRoutes.post(`/process`, validateRequest(processSchema), async (req: Request, res: Response) => {
  try {
    const {
      chainCmds,
      filterCmds,
      input,
      output,
      createDir = true,
      callbackId = cuid2.createId(),
      callbackUrl,
    } = req.body as z.infer<typeof processSchema>;
    if (callbackUrl) {
      res.status(200).json({ callbackId, callbackUrl });
    }

    let cmd = `${ffmpegPath}ffmpeg -y`;
    if (input) {
      cmd += ` -i ${fsPath}/${input}`;
    }
    if (chainCmds && chainCmds.length > 0) {
      chainCmds.forEach((chainCmd) => {
        const [key, value] = chainCmd.split(" ");
        if (key === "-i") {
          cmd += ` ${key} ${fsPath}/${value}`;
        } else {
          cmd += ` ${key} ${value}`;
        }
      });
    }
    if (filterCmds && filterCmds.length > 0) {
      cmd += ` -vf "${filterCmds.join(", ")}"`;
    }
    if (createDir && output) {
      await runcmd(`mkdir -p ${fsPath}/${output.split("/").slice(0, -1).join("/")}`);
    }
    if (output) {
      cmd += ` ${fsPath}/${output}`;
    }
    await runcmd(cmd);
    if (callbackUrl) {
      axios.post(callbackUrl, { callbackId }).catch((error: AxiosError) => {
        console.log("Error invoking callbackUrl", error);
      });
      return;
    }
    res.status(200).json({ callbackId });
  } catch (error) {
    res.status(400).json({ error: error.message });
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
    res.status(400).json({ error });
  }
});

ffmpegRoutes.post(`/vmaf`, validateRequest(vmafSchema), async (req: Request, res: Response) => {
  try {
    const {
      input1,
      input2,
      scale,
      model,
      subsample = 10,
      threads = 8,
      callbackId = cuid2.createId(),
      callbackUrl,
    } = req.body as z.infer<typeof vmafSchema>;
    if (callbackUrl) {
      res.status(200).json({ callbackId, callbackUrl });
    }
    let cmd = `${ffmpegPath}ffmpeg`;
    const modelPath = path.join(__dirname, "..", "models", `${model}.json`);

    cmd += ` -i ${fsPath}/${input1} -i ${fsPath}/${input2} -lavfi "[0:v]${scale}:flags=bicubic[distorted];[1:v]${scale}:flags=bicubic[reference];[distorted][reference]libvmaf=model='path=${modelPath}':n_subsample=${subsample}:n_threads=${threads}" -f null -`;
    const data = await runcmd(cmd);
    let score = Math.floor(parseFloat(data.split("VMAF score:")[1]));
    score = isNaN(score) ? 0 : score;

    if (callbackUrl) {
      axios.post(callbackUrl, { callbackId, data: { score } }).catch((error: AxiosError) => {
        console.log("Error invoking callbackUrl", error);
      });
      return;
    }
    res.status(200).json({ data: { score } });
  } catch (error) {
    res.status(400).json({ error });
  }
});
