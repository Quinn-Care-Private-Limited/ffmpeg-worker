import { z } from "zod";
import express, { Request, Response } from "express";
import { validateRequest } from "middlewares/req-validator";
import {
  multiProcessHandler,
  multiProcessScheduleSchema,
  multiProcessSchema,
  probeHandler,
  probeSchema,
  processHandler,
  processScheduleSchema,
  processSchema,
  rawProbeHandler,
  vmafHandler,
  vmafSchema,
} from "handlers/ffmpeg";

export const ffmpegRoutes = express.Router();

ffmpegRoutes.post(`/process`, validateRequest(processSchema), async (req: Request, res: Response) => {
  const resp = await processHandler(req.body);
  res.status(resp.status).json(resp.data);
});

ffmpegRoutes.post(`/multi_process`, validateRequest(multiProcessSchema), async (req: Request, res: Response) => {
  const resp = await multiProcessHandler(req.body);
  res.status(resp.status).json(resp.data);
});

ffmpegRoutes.post(`/process/schedule`, validateRequest(processScheduleSchema), async (req: Request, res: Response) => {
  const { async, callbackId } = req.body as z.infer<typeof processScheduleSchema>;
  if (async) {
    res.status(200).json({ callbackId });
  }

  const resp = await processHandler(req.body);

  if (async) return;
  res.status(resp.status).json(resp.data);
});

ffmpegRoutes.post(
  `/multi_process/schedule`,
  validateRequest(multiProcessScheduleSchema),
  async (req: Request, res: Response) => {
    const { async, callbackId } = req.body as z.infer<typeof multiProcessScheduleSchema>;
    if (async) {
      res.status(200).json({ callbackId });
    }

    const resp = await multiProcessHandler(req.body);

    if (async) return;
    res.status(resp.status).json(resp.data);
  },
);

ffmpegRoutes.post(`/vmaf`, validateRequest(vmafSchema), async (req: Request, res: Response) => {
  const resp = await vmafHandler(req.body);
  res.status(resp.status).json(resp.data);
});

ffmpegRoutes.post(`/probe`, validateRequest(probeSchema), async (req: Request, res: Response) => {
  const resp = await probeHandler(req.body);
  res.status(resp.status).json(resp.data);
});

ffmpegRoutes.post(`/raw_probe`, validateRequest(probeSchema), async (req: Request, res: Response) => {
  const resp = await rawProbeHandler(req.body);
  res.status(resp.status).json(resp.data);
});
