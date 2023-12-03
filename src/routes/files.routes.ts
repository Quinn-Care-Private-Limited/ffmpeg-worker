import fs from "fs";
import { z } from "zod";
import express, { Request, Response } from "express";
import { validateRequest } from "middlewares/req-validator";

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
      await fs.promises.mkdir(`${fsPath}/${path.split("/").slice(0, -1).join("/")}`, { recursive: true });
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
