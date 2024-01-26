import { exec } from "child_process";
import { Request } from "express";
import { IResponsePayload } from "types";
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
        cmd += ` ${key} ${fsPath}/${value}`;
      } else {
        cmd += ` ${chainCmd}`;
      }
    });
  }

  if (output) {
    await fs.promises.mkdir(`${fsPath}/${output.split("/").slice(0, -1).join("/")}`, { recursive: true });
    cmd += ` ${fsPath}/${output}`;
  }

  return runcmd(cmd);
}

export function getWebhookResponsePayload(req: Request, status: number, responseTime: number): IResponsePayload {
  return {
    baseURL: req.baseUrl,
    method: req.method,
    path: req.originalUrl.replace("/api", ""),
    status,
    responseTime,
  };
}
