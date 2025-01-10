import fs from "fs";
import cuid2 from "@paralleldrive/cuid2";
import { CloudStorageType, getStorageConnector } from "cloud-storage/connector";
import express, { Request, Response } from "express";
import { z } from "zod";
import { WebhookType } from "handlers/types";
import { validateRequest } from "middlewares/req-validator";
import { getWebhookResponsePayload, sendWebhook } from "handlers/utils";

export const storageRoutes = express.Router();

const fsPath = process.env.FS_PATH || "";
const cloudStorageType = process.env.CLOUD_STORAGE_TYPE as CloudStorageType;

const downloadSchema = z.object({
  bucket: z.string(),
  key: z.string(),
  path: z.string(),
  multipart: z.boolean().optional(),
  partSize: z.number().optional(),
});

const downloadScheduleSchema = downloadSchema.extend({
  async: z.boolean().optional(),
  callbackId: z.string().optional(),
  callbackUrl: z.string(),
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
  ttl: z.number().optional(),
});

const uploadScheduleSchema = uploadSchema.extend({
  async: z.boolean().optional(),
  callbackId: z.string().optional(),
  callbackUrl: z.string(),
  callbackMeta: z.record(z.any()).optional(),
});

storageRoutes.post(`/download`, validateRequest(downloadSchema), async (req: Request, res: Response) => {
  const { bucket, key, path, multipart, partSize } = req.body as z.infer<typeof downloadSchema>;
  try {
    const filePath = `${fsPath}/${path}`;
    const dirPath = filePath.split("/").slice(0, -1).join("/");
    await fs.promises.mkdir(dirPath, { recursive: true });
    const storage = getStorageConnector(cloudStorageType);

    if (multipart) {
      await storage.downloadMultipartObject({ bucketName: bucket, objectKey: key, filePath, partSize });
    } else {
      if (multipart) {
        await storage.downloadMultipartObject({ bucketName: bucket, objectKey: key, filePath, partSize });
      } else {
        await storage.downloadObject({ bucketName: bucket, objectKey: key, filePath });
      }
    }

    res.status(200).json({ bucket, key, path });
  } catch (error) {
    console.log(error);
    res.status(400).send("Error downloading file");
  }
});

storageRoutes.post(
  `/download/schedule`,
  validateRequest(downloadScheduleSchema),
  async (req: Request, res: Response) => {
    const {
      bucket,
      key,
      path,
      multipart,
      partSize,
      async,
      callbackId = cuid2.createId(),
      callbackUrl = "",
      callbackMeta = {},
    } = req.body as z.infer<typeof downloadScheduleSchema>;
    const start = Date.now();

    try {
      if (async) {
        res.status(200).json({ callbackId });
      }
      const filePath = `${fsPath}/${path}`;
      const dirPath = filePath.split("/").slice(0, -1).join("/");
      await fs.promises.mkdir(dirPath, { recursive: true });

      const storage = getStorageConnector(cloudStorageType);

      if (multipart) {
        await storage.downloadMultipartObject({ bucketName: bucket, objectKey: key, filePath, partSize });
      } else {
        if (multipart) {
          await storage.downloadMultipartObject({ bucketName: bucket, objectKey: key, filePath, partSize });
        } else {
          await storage.downloadObject({ bucketName: bucket, objectKey: key, filePath });
        }
      }
      await sendWebhook(callbackUrl, {
        callbackId,
        callbackMeta,
        type: WebhookType.STORAGE_DOWNLOAD,
        success: true,
        data: {
          bucket,
          key,
          path,
        },
        responsePayload: getWebhookResponsePayload(req, 200, Date.now() - start),
      });

      if (!async) {
        res.status(200).json({ bucket, key, path });
      }
    } catch (error) {
      console.log(error);
      await sendWebhook(callbackUrl, {
        callbackId,
        callbackMeta,
        type: WebhookType.STORAGE_DOWNLOAD,
        success: false,
        data: "Error downloading file",
        responsePayload: getWebhookResponsePayload(req, 400, Date.now() - start),
      });
      if (!async) {
        res.status(400).send("Error downloading file");
      }
    }
  },
);

storageRoutes.post(`/upload`, validateRequest(uploadSchema), async (req: Request, res: Response) => {
  const { bucket, key, path, contentType, multipart, partSize, batchSize, ttl } = req.body as z.infer<
    typeof uploadSchema
  >;
  try {
    if (process.env.NODE_ENV === "production") {
      const storage = getStorageConnector(cloudStorageType);
      const filePath = `${fsPath}/${path}`;
      if (multipart) {
        await storage.uploadMultipartObject({
          bucketName: bucket,
          objectKey: key,
          filePath,
          contentType,
          partSize,
          batchSize,
          ttl,
        });
      } else {
        await storage.uploadObject({
          bucketName: bucket,
          objectKey: key,
          filePath,
          contentType,
          ttl,
        });
      }
    }

    res.status(200).json({ bucket, key, path });
  } catch (error) {
    console.log(error);
    res.status(400).send("Error uploading file");
  }
});

storageRoutes.post(`/upload/schedule`, validateRequest(uploadScheduleSchema), async (req: Request, res: Response) => {
  const {
    bucket,
    key,
    path,
    contentType,
    multipart,
    partSize,
    batchSize,
    async,
    callbackId = cuid2.createId(),
    callbackUrl = "",
    callbackMeta = {},
  } = req.body as z.infer<typeof uploadScheduleSchema>;
  const start = Date.now();
  try {
    if (async) {
      res.status(200).json({ callbackId });
    }

    if (process.env.NODE_ENV === "production") {
      const storage = getStorageConnector(cloudStorageType);
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
    }

    await sendWebhook(callbackUrl, {
      callbackId,
      callbackMeta,
      type: WebhookType.STORAGE_UPLOAD,
      success: true,
      data: {
        bucket,
        key,
        path,
      },
      responsePayload: getWebhookResponsePayload(req, 200, Date.now() - start),
    });

    if (!async) {
      res.status(200).json({ bucket, key, path });
    }
  } catch (error) {
    console.log(error);
    await sendWebhook(callbackUrl, {
      callbackId,
      callbackMeta,
      type: WebhookType.STORAGE_UPLOAD,
      success: false,
      data: "Error uploading file",
      responsePayload: getWebhookResponsePayload(req, 400, Date.now() - start),
    });

    if (!async) {
      res.status(400).send("Error uploading file");
    }
  }
});
