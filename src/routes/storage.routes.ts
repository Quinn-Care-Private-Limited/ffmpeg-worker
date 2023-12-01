import fs from "fs";
import cuid2 from "@paralleldrive/cuid2";
import axios, { AxiosError } from "axios";
import { CloudStorageType, getStorageConnector } from "cloud-storage/connector";
import express, { Request, Response } from "express";
import { z } from "zod";

export const storageRoutes = express.Router();

const fsPath = process.env.FS_PATH || "";
const cloudStorage = process.env.CLOUD_STORAGE as CloudStorageType;

const storage = getStorageConnector(cloudStorage);

const downloadSchema = z.object({
  bucket: z.string(),
  key: z.string(),
  path: z.string(),
  multipart: z.boolean().optional(),
  callbackId: z.string().optional(),
  callbackUrl: z.string().optional(),
});

const uploadSchema = z.object({
  bucket: z.string(),
  key: z.string(),
  path: z.string(),
  contentType: z.string(),
  multipart: z.boolean().optional(),
  callbackId: z.string().optional(),
  callbackUrl: z.string().optional(),
});

storageRoutes.post(`/download`, async (req: Request, res: Response) => {
  try {
    const {
      bucket,
      key,
      path,
      multipart,
      callbackId = cuid2.createId(),
      callbackUrl = "",
    } = req.body as z.infer<typeof downloadSchema>;

    if (callbackUrl) {
      res.status(200).json({ callbackId, callbackUrl });
    }

    const filePath = `${fsPath}/${path}`;
    const dirPath = filePath.split("/").slice(0, -1).join("/");
    await fs.promises.mkdir(dirPath, { recursive: true });

    if (multipart) {
      await storage.downloadMultipartObject({ bucketName: bucket, objectKey: key, filePath });
    } else {
      await storage.downloadObject({ bucketName: bucket, objectKey: key, filePath });
    }
    if (callbackUrl) {
      axios.post(callbackUrl, { callbackId }).catch((error: AxiosError) => {
        console.log("Error invoking callbackUrl", error);
      });
      return;
    }
    res.status(200).json({ callbackId });
  } catch (error) {
    res.status(400).json({ error });
  }
});

storageRoutes.post(`/upload`, async (req: Request, res: Response) => {
  try {
    const {
      bucket,
      key,
      path,
      contentType,
      multipart,
      callbackId = cuid2.createId(),
      callbackUrl = "",
    } = req.body as z.infer<typeof uploadSchema>;

    if (callbackUrl) {
      res.status(200).json({ callbackId, callbackUrl });
    }

    if (multipart) {
      await storage.uploadMultipartObject({
        bucketName: bucket,
        objectKey: key,
        filePath: `${fsPath}/${path}`,
        contentType,
      });
    } else {
      await storage.uploadObject({
        bucketName: bucket,
        objectKey: key,
        filePath: `${fsPath}/${path}`,
        contentType,
      });
    }

    if (callbackUrl) {
      axios.post(callbackUrl, { callbackId }).catch((error: AxiosError) => {
        console.log("Error invoking callbackUrl", error);
      });
      return;
    }
    res.status(200).json({ callbackId });
  } catch (error) {
    res.status(400).json({ error });
  }
});
