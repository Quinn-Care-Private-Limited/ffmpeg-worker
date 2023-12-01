import { exec } from "child_process";

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
