import { exec } from "child_process";
import { IResponsePayload, IWebhookResponse } from "./types";
import axios from "axios";
import fs from "fs";

const fsPath = process.env.FS_PATH || ".";
const ffmpegPath = process.env.FFMPEG_PATH || "";

export function runcmd(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout || stderr);
      }
    });
  });
}

export async function sleep(delay: number) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

export async function runProcess(payload: { chainCmds?: string[]; output?: string }) {
  const { chainCmds, output } = payload;

  let cmd = `${ffmpegPath}ffmpeg -y`;

  if (chainCmds && chainCmds.length > 0) {
    chainCmds.forEach((chainCmd) => {
      const [key, value] = chainCmd.split(" ");
      if (key === "-i" || key === "-passlogfile") {
        if (value.startsWith("anullsrc") || value.startsWith("nullsrc")) {
          cmd += ` ${key} ${value}`;
        } else {
          cmd += ` ${key} ${fsPath}/${value}`;
        }
      } else {
        cmd += ` ${chainCmd}`;
      }
    });
  }

  if (output) {
    if (output === "/dev/null") {
      cmd += ` ${output}`;
    } else {
      await fs.promises.mkdir(`${fsPath}/${output.split("/").slice(0, -1).join("/")}`, { recursive: true });
      cmd += ` ${fsPath}/${output}`;
    }
  }

  // console.log(cmd);

  return runcmd(cmd);
}

export function getWebhookResponsePayload(
  req: {
    baseUrl: string;
    method: string;
    originalUrl: string;
  },
  status: number,
  responseTime: number,
): IResponsePayload {
  return {
    baseURL: req.baseUrl,
    method: req.method,
    path: req.originalUrl.replace("/api", ""),
    status,
    responseTime,
  };
}

const MAX_RETRIES = 3;
export const sendWebhook = async (url: string, payload: IWebhookResponse, responseTime = 0, retries = 0) => {
  try {
    await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        "X-Response-Time": responseTime,
      },
    });
  } catch (error) {
    if (retries < MAX_RETRIES) {
      await sleep(1000);
      await sendWebhook(url, payload, responseTime, retries + 1);
    } else {
      console.log(`Error invoking callbackUrl ${url}`, error.message);
    }
  }
};
