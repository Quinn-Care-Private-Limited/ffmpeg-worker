import fs from "fs";
import cuid2 from "@paralleldrive/cuid2";
import { CloudStorageType, getStorageConnector } from "cloud-storage/connector";
import express, { Request, Response } from "express";
import { z } from "zod";
import { sendWebhook } from "utils/webhook";
import { WebhookType } from "types";

export const storageRoutes = express.Router();

const fsPath = process.env.FS_PATH || "";
const cloudStorage = process.env.CLOUD_STORAGE as CloudStorageType;

const storage = getStorageConnector(cloudStorage);

const downloadSchema = z.object({
  bucket: z.string(),
  key: z.string(),
  path: z.string(),
  multipart: z.boolean().optional(),
  partSize: z.number().optional(),
  callbackId: z.string().optional(),
  callbackUrl: z.string().optional(),
  callbackMeta: z.record(z.any()).optional(),
});

const uploadSchema = z.object({
  bucket: z.string(),
  key: z.string(),
  path: z.string(),
  contentType: z.string(),
  multipart: z.boolean().optional(),
  partSize: z.number().optional(),
  batchSize: z.number().optional(),
  callbackId: z.string().optional(),
  callbackUrl: z.string().optional(),
  callbackMeta: z.record(z.any()).optional(),
});

storageRoutes.post(`/download`, async (req: Request, res: Response) => {
  const {
    bucket,
    key,
    path,
    multipart,
    partSize,
    callbackId = cuid2.createId(),
    callbackUrl = "",
    callbackMeta = {},
  } = req.body as z.infer<typeof downloadSchema>;

  try {
    if (callbackUrl) {
      res.status(200).json({ callbackId });
    }

    const filePath = `${fsPath}/${path}`;
    const dirPath = filePath.split("/").slice(0, -1).join("/");
    await fs.promises.mkdir(dirPath, { recursive: true });

    if (multipart) {
      await storage.downloadMultipartObject({ bucketName: bucket, objectKey: key, filePath, partSize });
    } else {
      await storage.downloadObject({ bucketName: bucket, objectKey: key, filePath });
    }
    if (callbackUrl) {
      sendWebhook(callbackUrl, {
        callbackId,
        callbackMeta,
        type: WebhookType.STORAGE_DOWNLOAD,
        success: true,
        data: {
          bucket,
          key,
          path,
        },
      });
    } else {
      res.status(200).json({ bucket, key, path });
    }
  } catch (error) {
    if (callbackUrl) {
      sendWebhook(callbackUrl, {
        callbackId,
        callbackMeta,
        type: WebhookType.STORAGE_DOWNLOAD,
        success: false,
        data: "Error downloading file",
      });
    } else {
      res.status(400).send("Error downloading file");
    }
  }
});

storageRoutes.post(`/upload`, async (req: Request, res: Response) => {
  const {
    bucket,
    key,
    path,
    contentType,
    multipart,
    partSize,
    batchSize,
    callbackId = cuid2.createId(),
    callbackUrl = "",
    callbackMeta = {},
  } = req.body as z.infer<typeof uploadSchema>;
  try {
    if (callbackUrl) {
      res.status(200).json({ callbackId });
    }

    const filePath = `${fsPath}/${path}`;
    if (multipart) {
      await storage.uploadMultipartObject({
        bucketName: bucket,
        objectKey: key,
        filePath,
        contentType,
        partSize,
        batchSize,
      });
    } else {
      await storage.uploadObject({
        bucketName: bucket,
        objectKey: key,
        filePath,
        contentType,
      });
    }

    if (callbackUrl) {
      sendWebhook(callbackUrl, {
        callbackId,
        callbackMeta,
        type: WebhookType.STORAGE_UPLOAD,
        success: true,
        data: {
          bucket,
          key,
          path,
        },
      });
    } else {
      res.status(200).json({ bucket, key, path });
    }
  } catch (error) {
    if (callbackUrl) {
      sendWebhook(callbackUrl, {
        callbackId,
        callbackMeta,
        type: WebhookType.STORAGE_UPLOAD,
        success: false,
        data: "Error uploading file",
      });
    } else {
      res.status(400).send("Error uploading file");
    }
  }
});
