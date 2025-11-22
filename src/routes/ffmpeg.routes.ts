import { z } from "zod";
import express, { Request, Response } from "express";
import { validateRequest } from "middlewares/req-validator";
import {
  processHandler,
  processSchema,
} from "handlers/ffmpeg";

export const ffmpegRoutes = express.Router();

ffmpegRoutes.post(`/process`, validateRequest(processSchema), async (req: Request, res: Response) => {
  const resp = await processHandler(req.body);
  res.status(resp.status).json(resp.data);
});
