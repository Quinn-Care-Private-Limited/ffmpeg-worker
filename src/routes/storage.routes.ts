import cuid2 from "@paralleldrive/cuid2";
import express, { Request, Response } from "express";
import { z } from "zod";
import { validateRequest } from "middlewares/req-validator";
import {
  downloadHandler,
  downloadScheduleHandler,
  downloadScheduleSchema,
  downloadSchema,
  uploadHandler,
  uploadScheduleHandler,
  uploadScheduleSchema,
  uploadSchema,
} from "handlers/storage";
import { getStorageConnector } from "cloud-storage/connector";
import { CloudStorageType } from "types";

export const storageRoutes = express.Router();

const storage = getStorageConnector(process.env.CLOUD_STORAGE_TYPE as CloudStorageType);

storageRoutes.post(`/download`, validateRequest(downloadSchema), async (req: Request, res: Response) => {
  const resp = await downloadHandler(req.body, storage);
  res.status(resp.status).json(resp.data);
});

storageRoutes.post(
  `/download/schedule`,
  validateRequest(downloadScheduleSchema),
  async (req: Request, res: Response) => {
    const { async, callbackId = cuid2.createId() } = req.body as z.infer<typeof downloadScheduleSchema>;
    if (async) {
      res.status(200).json({ callbackId });
    }

    const resp = await downloadScheduleHandler(req.body, storage);

    if (async) return;
    res.status(resp.status).json(resp.data);
  },
);

storageRoutes.post(`/upload`, validateRequest(uploadSchema), async (req: Request, res: Response) => {
  const resp = await uploadHandler(req.body, storage);
  res.status(resp.status).json(resp.data);
});

storageRoutes.post(`/upload/schedule`, validateRequest(uploadScheduleSchema), async (req: Request, res: Response) => {
  const { async, callbackId = cuid2.createId() } = req.body as z.infer<typeof uploadScheduleSchema>;
  if (async) {
    res.status(200).json({ callbackId });
  }

  const resp = await uploadScheduleHandler(req.body, storage);

  if (async) return;
  res.status(resp.status).json(resp.data);
});
