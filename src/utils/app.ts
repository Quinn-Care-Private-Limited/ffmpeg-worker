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

export async function runProcess(payload: { chainCmds?: string[]; output?: string }, path = fsPath) {
  const { chainCmds, output } = payload;

  let cmd = `${ffmpegPath}ffmpeg -y`;
  console.log(`Running process with path: ${path}`);
  if (chainCmds && chainCmds.length > 0) {
    chainCmds.forEach((chainCmd) => {
      const [key, value] = chainCmd.split(" ");
      if (key === "-i" || key === "-passlogfile") {
        if (value.startsWith("anullsrc") || value.startsWith("nullsrc")) {
          cmd += ` ${key} ${value}`;
        } else {
          cmd += ` ${key} ${path}/${value}`;
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
      await fs.promises.mkdir(`${path}/${output.split("/").slice(0, -1).join("/")}`, { recursive: true });
      cmd += ` ${path}/${output}`;
    }
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

export function parseAbrMasterFile(string: string): { bandwidth: string; url: string }[] {
  const lines = string.split("\n");
  const result = [];
  let obj: any = {};
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes("#EXT-X-STREAM-INF")) {
      obj = {};
      const bandwidth = line.match(/BANDWIDTH=(\d+)/)![1]!;
      obj.bandwidth = +bandwidth;
    } else if (line.includes(".m3u8")) {
      obj.url = line;
      result.push(obj);
    }
  }
  return result.sort((a, b) => b.bandwidth - a.bandwidth);
}

export function getChunks(streamString: string) {
  const lines = streamString.split("\n");
  const chunks = [];
  let chunk: any = {};
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("#EXTINF:")) {
      chunk = {
        duration: Number(line.split(":")[1]),
      };
    } else if (line.startsWith("chunk")) {
      chunk.url = line;
      chunks.push(chunk);
      chunk = null;
    }
  }
  return chunks;
}
