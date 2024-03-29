import fs from "fs";
import { z } from "zod";
import express, { Request, Response } from "express";
import { validateRequest } from "middlewares/req-validator";
import { runcmd } from "utils/app";

const ffmpegPath = process.env.FFMPEG_PATH || "";

export const filesRoutes = express.Router();
const fsPath = process.env.FS_PATH || ".";

const listSchema = z.object({
  path: z.string().optional(),
});

const checkSchema = z.object({
  path: z.string(),
});

const createFileSchema = z.object({
  path: z.string(),
  data: z.string().optional(),
});

const readFileSchema = z.object({
  path: z.string(),
});

const deleteSchema = z.object({
  path: z.string(),
});

const infoSchema = z.object({
  input: z.string(),
});

const copySchema = z.object({
  input: z.string(),
  output: z.string(),
});

const downloadSchema = z.object({
  url: z.string(),
  output: z.string(),
});

filesRoutes.post(`/path`, async (req: Request, res: Response) => {
  try {
    res.status(200).json({ path: fsPath });
  } catch (error) {
    res.status(400).send(error.message);
  }
});

filesRoutes.post(`/list`, validateRequest(listSchema), async (req: Request, res: Response) => {
  try {
    const { path = "" } = req.body as z.infer<typeof listSchema>;
    const data = await fs.promises.readdir(`${fsPath}/${path}`);
    res.status(200).json({ list: data });
  } catch (error) {
    res.status(400).send(error.message);
  }
});

filesRoutes.post(`/check`, validateRequest(checkSchema), async (req: Request, res: Response) => {
  try {
    const { path } = req.body as z.infer<typeof checkSchema>;
    const stat = await fs.promises.stat(`${fsPath}/${path}`);
    res.status(200).json({
      isExists: true,
      isDirectory: stat.isDirectory(),
    });
  } catch (error) {
    res.status(200).json({
      isExists: false,
    });
  }
});

filesRoutes.post(`/create`, validateRequest(createFileSchema), async (req: Request, res: Response) => {
  try {
    const { path, data } = req.body as z.infer<typeof createFileSchema>;

    if (data) {
      const dirPath = `${fsPath}/${path.split("/").slice(0, -1).join("/")}`;
      const stat = await fs.promises.stat(`${fsPath}/${path}`).catch(() => false);

      if (!stat) {
        await fs.promises.mkdir(dirPath, { recursive: true });
      }
      await fs.promises.writeFile(`${fsPath}/${path}`, data);
    } else {
      await fs.promises.mkdir(`${fsPath}/${path}`, { recursive: true });
    }
    res.status(200).json({});
  } catch (error) {
    res.status(400).send(error.message);
  }
});

filesRoutes.post(`/read`, validateRequest(readFileSchema), async (req: Request, res: Response) => {
  try {
    const { path } = req.body as z.infer<typeof readFileSchema>;
    const data = await fs.promises.readFile(`${fsPath}/${path}`, "utf8");
    res.status(200).json({ data });
  } catch (error) {
    res.status(400).send(error.message);
  }
});

filesRoutes.post(`/delete`, validateRequest(deleteSchema), async (req: Request, res: Response) => {
  try {
    const { path } = req.body as z.infer<typeof deleteSchema>;
    const stat = await fs.promises.stat(`${fsPath}/${path}`);
    if (stat.isDirectory()) {
      await fs.promises.rmdir(`${fsPath}/${path}`, { recursive: true });
    } else {
      await fs.promises.unlink(`${fsPath}/${path}`);
    }
    res.status(200).json({});
  } catch (error) {
    res.status(400).send(error.message);
  }
});

filesRoutes.post(`/info`, validateRequest(infoSchema), async (req: Request, res: Response) => {
  try {
    const { input } = req.body as z.infer<typeof infoSchema>;
    let cmd = `${ffmpegPath}ffprobe`;

    const infoCmd = `${cmd} -v error -select_streams v:0 -show_entries stream=duration,width,height,bit_rate,r_frame_rate -of default=noprint_wrappers=1 ${fsPath}/${input}`;
    const sizeCmd = `${cmd} -v error -select_streams v:0 -show_entries format=size -of default=noprint_wrappers=1 ${fsPath}/${input}`;

    const [fileInfo, sizeData] = await Promise.all([runcmd(infoCmd), runcmd(sizeCmd)]);
    const data: any = {};
    const lines = `${fileInfo}\n${sizeData}`.split("\n");

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

    res.status(200).json({ data });
  } catch (error) {
    res.status(400).send(error.message);
  }
});

filesRoutes.post(`/copy`, validateRequest(copySchema), async (req: Request, res: Response) => {
  try {
    const { input, output } = req.body as z.infer<typeof copySchema>;
    const dirPath = `${fsPath}/${output.split("/").slice(0, -1).join("/")}`;

    const isExists = await fs.promises.stat(dirPath).catch(() => false);
    if (!isExists) {
      await fs.promises.mkdir(dirPath, { recursive: true });
    }
    await fs.promises.copyFile(`${fsPath}/${input}`, `${fsPath}/${output}`);
    res.status(200).json({});
  } catch (error) {
    res.status(400).send(error.message);
  }
});

filesRoutes.post(`/download`, validateRequest(downloadSchema), async (req: Request, res: Response) => {
  try {
    const { url, output } = req.body as z.infer<typeof downloadSchema>;
    const dirPath = `${fsPath}/${output.split("/").slice(0, -1).join("/")}`;

    const isExists = await fs.promises.stat(dirPath).catch(() => false);
    if (!isExists) {
      await fs.promises.mkdir(dirPath, { recursive: true });
    }
    await runcmd(`wget -O ${fsPath}/${output} ${url}`);
    res.status(200).json({});
  } catch (error) {
    res.status(400).send(error.message);
  }
});
