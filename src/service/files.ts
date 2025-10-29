import fs from "fs";
import { runcmd } from "utils/app";
import { ffmpegPath, tempPath } from "./config";

export default class Files {
  static async list({ path = "" }: { path?: string }) {
    const data = await fs.promises.readdir(`${tempPath}/${path}`);
    return data;
  }
  static async path() {
    return `${tempPath}`;
  }
  static async check({ path }: { path: string }) {
    const stat = await fs.promises.stat(`${tempPath}/${path}`);
    return {
      isExists: true,
      isDirectory: stat.isDirectory(),
    };
  }
  static async create({ path, data, encoding = "utf-8" }: { path: string; data?: string; encoding?: BufferEncoding }) {
    if (data) {
      const dirPath = `${tempPath}/${path.split("/").slice(0, -1).join("/")}`;
      const stat = await fs.promises.stat(`${tempPath}/${path}`).catch(() => false);

      if (!stat) {
        await fs.promises.mkdir(dirPath, { recursive: true });
      }
      await fs.promises.writeFile(`${tempPath}/${path}`, data, {
        encoding,
      });
    } else {
      await fs.promises.mkdir(`${tempPath}/${path}`, { recursive: true });
    }
  }
  static async read({ path }: { path: string }) {
    const data = await fs.promises.readFile(`${tempPath}/${path}`, "utf8");
    return data;
  }
  static async delete({ path }: { path: string }) {
    const stat = await fs.promises.stat(`${tempPath}/${path}`);
    if (stat.isDirectory()) {
      await fs.promises.rmdir(`${tempPath}/${path}`, { recursive: true });
    } else {
      await fs.promises.unlink(`${tempPath}/${path}`);
    }
  }
  static async info(filePath: string) {
    let cmd = `${ffmpegPath}ffprobe`;
    const path = `${tempPath}/${filePath}`;

    const extension = path.split(".").pop();
    const stream = ["mp3", "wav", "flac", "m4a", "aac", "opus"].includes(extension!) ? "a:0" : "v:0";

    const infoCmd = `${cmd} -v error -select_streams ${stream} -show_entries stream=duration,width,height,bit_rate,r_frame_rate -of default=noprint_wrappers=1 ${path}`;
    const sizeCmd = `${cmd} -v error -select_streams ${stream} -show_entries format=size -of default=noprint_wrappers=1 ${path}`;
    const rotationCmd = `${cmd} -v error -select_streams ${stream} -show_entries stream_side_data=rotation -of default=noprint_wrappers=1 ${path}`;
    const audioCmd = `${cmd} -v error -select_streams a -show_entries stream=codec_type -of default=noprint_wrappers=1 ${path}`;

    const [fileInfo, sizeData, rotationData, audioData] = await Promise.all([
      runcmd(infoCmd),
      runcmd(sizeCmd),
      runcmd(rotationCmd),
      runcmd(audioCmd),
    ]);
    const data: any = {};
    const lines = `${fileInfo}${sizeData}${rotationData}`.split("\n");
    // Check if file has audio
    data.hasAudio = audioData.includes("codec_type=audio");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const [key, value] = line.split("=");
      if (key && value) {
        if (key === "bit_rate") {
          data.avgbitrate = Math.floor(+value / 1000);
        } else if (key === "r_frame_rate") {
          const [num, den] = value.split("/");
          data.framerate = Math.round(+num / +den);
        } else if (key === "size") {
          data.size = Math.floor(+value / 1024);
        } else {
          data[key] = +value;
        }
      }
    }

    if (data.rotation === 90 || data.rotation === -90) {
      const { width, height } = data;
      data.width = height;
      data.height = width;
    }
    return data;
  }
  static async copy({ input, output }: { input: string; output: string }) {
    const dirPath = `${tempPath}/${output.split("/").slice(0, -1).join("/")}`;
    const isExists = await fs.promises.stat(dirPath).catch(() => false);
    if (!isExists) {
      await fs.promises.mkdir(dirPath, { recursive: true });
    }
    await fs.promises.copyFile(`${tempPath}/${input}`, `${tempPath}/${output}`);
  }
  static async download({ url, output }: { url: string; output: string }) {
    const dirPath = `${tempPath}/${output.split("/").slice(0, -1).join("/")}`;
    const isExists = await fs.promises.stat(dirPath).catch(() => false);
    if (!isExists) {
      await fs.promises.mkdir(dirPath, { recursive: true });
    }
    await runcmd(`wget -O ${tempPath}/${output} "${url}"`);
  }
}
