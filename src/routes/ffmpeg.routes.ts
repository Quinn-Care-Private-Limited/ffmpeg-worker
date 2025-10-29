import path from "path";
import { z } from "zod";
import express, { Request, Response } from "express";
import { validateRequest } from "middlewares/req-validator";
import { getWebhookResponsePayload, runProcess, runcmd } from "utils/app";
import cuid2 from "@paralleldrive/cuid2";
import { sendWebhook } from "utils/webhook";
import { WebhookType } from "types";
import { MediaProcessorUtils } from "service/MediaProcessingUtil";
import { File } from "winston/lib/winston/transports";
import Files from "service/files";

export const ffmpegRoutes = express.Router();

const fsPath = process.env.FS_PATH || ".";
const ffmpegPath = process.env.FFMPEG_PATH || "";

const processObjectSchema = z.object({
  chainCmds: z.array(z.string()).optional(),
  output: z.string().optional(),
});

const processSchema = processObjectSchema;

const multiProcessSchema = z.object({
  processes: z.array(processObjectSchema),
});

const processScheduleSchema = processSchema.extend({
  async: z.boolean().optional(),
  callbackId: z.string().optional(),
  callbackUrl: z.string(),
  callbackMeta: z.record(z.any()).optional(),
});

const multiProcessScheduleSchema = multiProcessSchema.extend({
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

ffmpegRoutes.post(`/process`, validateRequest(processSchema), async (req: Request, res: Response) => {
  const process = req.body as z.infer<typeof processSchema>;

  try {
    const data = await runProcess(process);
    res.status(200).json({ data });
  } catch (error) {
    res.status(400).send(error.message);
  }
});

ffmpegRoutes.post(`/multi_process`, validateRequest(processSchema), async (req: Request, res: Response) => {
  const { processes } = req.body as z.infer<typeof multiProcessSchema>;

  try {
    const outputs = [];
    for (const process of processes) {
      const data = await runProcess(process);
      outputs.push(data);
    }

    res.status(200).json({ data: outputs });
  } catch (error) {
    res.status(400).send(error.message);
  }
});

ffmpegRoutes.post(`/process/schedule`, validateRequest(processScheduleSchema), async (req: Request, res: Response) => {
  const {
    async,
    callbackId = cuid2.createId(),
    callbackUrl,
    callbackMeta = {},
    ...process
  } = req.body as z.infer<typeof processScheduleSchema>;
  const start = Date.now();

  try {
    if (async) {
      res.status(200).json({ callbackId });
    }
    const data = await runProcess(process);

    await sendWebhook(callbackUrl, {
      callbackId,
      callbackMeta,
      type: WebhookType.FFMPEG,
      success: true,
      data,
      responsePayload: getWebhookResponsePayload(req, 200, Date.now() - start),
    });

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
      responsePayload: getWebhookResponsePayload(req, 400, Date.now() - start),
    });

    if (!async) {
      res.status(400).send(error.message);
    }
  }
});

ffmpegRoutes.post(
  `/multi_process/schedule`,
  validateRequest(multiProcessScheduleSchema),
  async (req: Request, res: Response) => {
    const {
      processes,
      async,
      callbackId = cuid2.createId(),
      callbackUrl,
      callbackMeta = {},
    } = req.body as z.infer<typeof multiProcessScheduleSchema>;
    const start = Date.now();

    try {
      if (async) {
        res.status(200).json({ callbackId });
      }
      const outputs = [];
      for (const process of processes) {
        const data = await runProcess(process);
        outputs.push(data);
      }

      await sendWebhook(callbackUrl, {
        callbackId,
        callbackMeta,
        type: WebhookType.FFMPEG,
        success: true,
        data: outputs,
        responsePayload: getWebhookResponsePayload(req, 200, Date.now() - start),
      });

      if (!async) {
        res.status(200).json({ data: outputs });
      }
    } catch (error) {
      await sendWebhook(callbackUrl, {
        callbackId,
        callbackMeta,
        type: WebhookType.FFMPEG,
        success: false,
        data: error.message,
        responsePayload: getWebhookResponsePayload(req, 400, Date.now() - start),
      });

      if (!async) {
        res.status(400).send(error.message);
      }
    }
  },
);

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

const processV2Schema = z.object({
  mediaid: z.string(),
  sourceurl: z.string().optional(),
  bucket: z.string(),
  variants: z.array(z.string()),
  cloudStorageCredentials: z.any(),
});

ffmpegRoutes.post(`/process/v2`, validateRequest(processV2Schema), async (req: Request, res: Response) => {
  try {
    const { mediaid, sourceurl, bucket, cloudStorageCredentials, variants } = req.body as z.infer<
      typeof processV2Schema
    >;
    const mediaProcessorUtils = new MediaProcessorUtils();
    if (sourceurl) {
      console.log(`Downloading from source url ${sourceurl}`);
      // download from source url
      await mediaProcessorUtils.downloadFromSourceUrl({ sourceid: mediaid, sourceurl, cloudStorageCredentials });
    } else {
      console.log(`Downloading from bucket ${bucket}`);
      // download from bucket
      await mediaProcessorUtils.downloadFromSource({
        mediaid,
        sourceid: mediaid,
        cloudStorageCredentials,
        bucket: bucket,
      });
    }
    // this is where original file is stored
    const sourcePath = mediaProcessorUtils.getSourcePath(mediaid);
    const fileInfo = await Files.info(sourcePath);
    console.log(`File info: ${JSON.stringify(fileInfo)}`);
  } catch (error) {
    res.status(400).send(error.message);
  }
});
