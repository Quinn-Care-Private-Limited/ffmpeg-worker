import { exec, execFile } from "child_process";
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

/**
 * Split one chain segment into argv tokens, honouring single/double quotes so a quoted value that
 * contains spaces (e.g. canvas's `-filter_complex "..."`) stays a single token. We run ffmpeg WITHOUT
 * a shell (execFile), so a filter graph full of `;`, `()`, `[]` — like the assembly concat chain — is
 * handed to ffmpeg verbatim instead of being split/mangled by `/bin/sh`.
 */
function tokenizeArgs(segment: string): string[] {
  const tokens: string[] = [];
  let cur = "";
  let quoted = false;
  let quote = "";
  for (const ch of segment) {
    if (quote) {
      if (ch === quote) quote = "";
      else cur += ch;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      quoted = true;
      continue;
    }
    if (ch === " " || ch === "\t") {
      if (cur.length > 0 || quoted) {
        tokens.push(cur);
        cur = "";
        quoted = false;
      }
      continue;
    }
    cur += ch;
  }
  if (cur.length > 0 || quoted) tokens.push(cur);
  return tokens;
}

/** Run a binary with an argv array (no shell). ffmpeg stderr is verbose, so allow a large buffer. */
function runFile(file: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(file, args, { maxBuffer: 1024 * 1024 * 64 }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout || stderr);
      }
    });
  });
}

export async function runProcess(payload: { chainCmds?: string[]; output?: string }) {
  const { chainCmds, output } = payload;

  const args: string[] = ["-y"];

  if (chainCmds && chainCmds.length > 0) {
    chainCmds.forEach((chainCmd) => {
      const tokens = tokenizeArgs(chainCmd);
      if (tokens.length === 0) return;
      const [key, ...rest] = tokens;
      if (key === "-i" || key === "-passlogfile") {
        const value = rest[0] ?? "";
        const resolved =
          value.startsWith("anullsrc") || value.startsWith("nullsrc")
            ? value
            : `${fsPath}/${value}`;
        args.push(key, resolved, ...rest.slice(1));
      } else {
        args.push(...tokens);
      }
    });
  }

  if (output) {
    if (output === "/dev/null") {
      args.push(output);
    } else {
      await fs.promises.mkdir(`${fsPath}/${output.split("/").slice(0, -1).join("/")}`, { recursive: true });
      args.push(`${fsPath}/${output}`);
    }
  }

  // console.log("ffmpeg", args);

  return runFile(`${ffmpegPath}ffmpeg`, args);
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
