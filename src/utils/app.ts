import { exec } from "child_process";
import { Request } from "express";
import { IResponsePayload } from "types";

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

export function getWebhookResponsePayload(req: Request, status: number, responseTime: number): IResponsePayload {
  return {
    baseURL: req.baseUrl,
    method: req.method,
    path: req.path,
    status,
    responseTime,
  };
}
