import cuid2 from "@paralleldrive/cuid2";
import { IHandlerResponse, WebhookType } from "../types";
import { getWebhookResponsePayload, runcmd, runProcess, sendWebhook } from "../utils";
import { z } from "zod";
import path from "path";

const fsPath = process.env.FS_PATH || ".";
const ffmpegPath = process.env.FFMPEG_PATH || "";

export const processSchema = z.object({
  chainCmds: z.array(z.string()).optional(),
  output: z.string().optional(),
});

export const processHandler = async (body: z.infer<typeof processSchema>): Promise<IHandlerResponse> => {
  try {
    const data = await runProcess(body);
    return {
      status: 200,
      data: {
        output: data,
      },
    };
  } catch (error) {
    return {
      status: 400,
      data: {
        error: error.message,
      },
    };
  }
};

export const multiProcessSchema = z.object({
  processes: z.array(processSchema),
});

export const multiProcessHandler = async (body: z.infer<typeof multiProcessSchema>): Promise<IHandlerResponse> => {
  try {
    const data = await Promise.all(body.processes.map(runProcess));
    return {
      status: 200,
      data: {
        output: data,
      },
    };
  } catch (error) {
    return {
      status: 400,
      data: {
        error: error.message,
      },
    };
  }
};

export const processScheduleSchema = processSchema.extend({
  async: z.boolean().optional(),
  callbackId: z.string().optional(),
  callbackUrl: z.string(),
  callbackMeta: z.record(z.any()).optional(),
});

export const processScheduleHandler = async (
  body: z.infer<typeof processScheduleSchema>,
  req?: {
    baseUrl: string;
    method: string;
    originalUrl: string;
  },
): Promise<IHandlerResponse> => {
  const { callbackId = cuid2.createId(), callbackUrl, callbackMeta = {}, ...process } = body;
  const start = Date.now();

  try {
    const data = await runProcess(process);

    await sendWebhook(callbackUrl, {
      callbackId,
      callbackMeta,
      type: WebhookType.FFMPEG,
      success: true,
      data,
      responsePayload: req && getWebhookResponsePayload(req, 200, Date.now() - start),
    });

    return {
      status: 200,
      data: {
        output: data,
      },
    };
  } catch (error) {
    await sendWebhook(callbackUrl, {
      callbackId,
      callbackMeta,
      type: WebhookType.FFMPEG,
      success: false,
      data: {
        error: error.message,
      },
      responsePayload: req && getWebhookResponsePayload(req, 400, Date.now() - start),
    });

    return {
      status: 400,
      data: {
        error: error.message,
      },
    };
  }
};

export const multiProcessScheduleSchema = multiProcessSchema.extend({
  async: z.boolean().optional(),
  callbackId: z.string().optional(),
  callbackUrl: z.string(),
  callbackMeta: z.record(z.any()).optional(),
});

export const multiProcessScheduleHandler = async (
  body: z.infer<typeof multiProcessScheduleSchema>,
  req?: {
    baseUrl: string;
    method: string;
    originalUrl: string;
  },
): Promise<IHandlerResponse> => {
  const { callbackId = cuid2.createId(), callbackUrl, callbackMeta = {}, processes } = body;
  const start = Date.now();

  try {
    const data = await Promise.all(processes.map(runProcess));

    await sendWebhook(callbackUrl, {
      callbackId,
      callbackMeta,
      type: WebhookType.FFMPEG,
      success: true,
      data,
      responsePayload: req && getWebhookResponsePayload(req, 200, Date.now() - start),
    });

    return {
      status: 200,
      data: {
        output: data,
      },
    };
  } catch (error) {
    await sendWebhook(callbackUrl, {
      callbackId,
      callbackMeta,
      type: WebhookType.FFMPEG,
      success: false,
      data: {
        error: error.message,
      },
      responsePayload: req && getWebhookResponsePayload(req, 400, Date.now() - start),
    });

    return {
      status: 400,
      data: {
        error: error.message,
      },
    };
  }
};

export const vmafSchema = z.object({
  input1: z.string(),
  input2: z.string(),
  scale: z.string(),
  model: z.string(),
  subsample: z.number().optional(),
  threads: z.number().optional(),
});

export const vmafHandler = async (body: z.infer<typeof vmafSchema>): Promise<IHandlerResponse> => {
  try {
    const { input1, input2, scale, model, subsample = 10, threads = 8 } = body as z.infer<typeof vmafSchema>;

    let cmd = `${ffmpegPath}ffmpeg`;
    const modelPath = path.join(__dirname, `${model}.json`);

    cmd += ` -i ${fsPath}/${input1} -i ${fsPath}/${input2} -lavfi "[0:v]${scale}:flags=bicubic,setpts=PTS-STARTPTS[distorted];[1:v]${scale}:flags=bicubic,setpts=PTS-STARTPTS[reference];[distorted][reference]libvmaf=model='path=${modelPath}':n_subsample=${subsample}:n_threads=${threads}" -f null -`;
    const data = await runcmd(cmd);
    let score = Math.floor(parseFloat(data.split("VMAF score:")[1]));
    score = isNaN(score) ? 0 : score;

    return {
      status: 200,
      data: { score },
    };
  } catch (error) {
    return {
      status: 400,
      data: {
        error: error.message,
      },
    };
  }
};

export const testHandler = async (): Promise<IHandlerResponse> => {
  try {
    const cmd = `${ffmpegPath}ffmpeg -version`;
    const data = await runcmd(cmd);

    return {
      status: 200,
      data,
    };
  } catch (error) {
    return {
      status: 400,
      data: {
        error: error.message,
      },
    };
  }
};
