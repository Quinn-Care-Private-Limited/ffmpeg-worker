import fs from "fs";
import cuid2 from "@paralleldrive/cuid2";
import { CloudStorageType, getStorageConnector } from "cloud-storage/connector";
import express, { Request, Response } from "express";
import { z } from "zod";
import { sendWebhook } from "utils/webhook";
import { WebhookType } from "types";
import { validateRequest } from "middlewares/req-validator";
import { getWebhookResponsePayload, sleep } from "utils/app";

export const storageRoutes = express.Router();

const fsPath = process.env.FS_PATH || "";

const credentialsSchema = z.any();

const downloadSchema = z.object({
  bucket: z.string(),
  key: z.string(),
  path: z.string(),
  multipart: z.boolean().optional(),
  partSize: z.number().optional(),
  cloudStorageType: z.string(),
  credentials: credentialsSchema,
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
  cloudStorageType: z.string(),
  credentials: credentialsSchema,
});

const uploadScheduleSchema = uploadSchema.extend({
  async: z.boolean().optional(),
  callbackId: z.string().optional(),
  callbackUrl: z.string(),
  callbackMeta: z.record(z.any()).optional(),
});

storageRoutes.post(`/download`, validateRequest(downloadSchema), async (req: Request, res: Response) => {
  const { bucket, key, path, multipart, partSize, credentials, cloudStorageType } = req.body as z.infer<
    typeof downloadSchema
  >;
  try {
    console.log(`download request `);
    const filePath = `${fsPath}/${path}`;
    const dirPath = filePath.split("/").slice(0, -1).join("/");
    await fs.promises.mkdir(dirPath, { recursive: true });
    const storage = getStorageConnector(cloudStorageType as CloudStorageType);

    if (multipart) {
      await storage.downloadMultipartObject({ bucketName: bucket, objectKey: key, filePath, partSize }, credentials);
    } else {
      if (multipart) {
        await storage.downloadMultipartObject({ bucketName: bucket, objectKey: key, filePath, partSize }, credentials);
      } else {
        await storage.downloadObject({ bucketName: bucket, objectKey: key, filePath }, credentials);
      }
    }
    await sleep(2000);

    res.status(200).json({ bucket, key, path });
  } catch (error) {
    console.log(`download error `, error);
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
      credentials,
      cloudStorageType,
      async,
      callbackId = cuid2.createId(),
      callbackUrl = "",
      callbackMeta = {},
    } = req.body as z.infer<typeof downloadScheduleSchema>;
    const start = Date.now();
    console.log(`download schedule request `);
    try {
      if (async) {
        res.status(200).json({ callbackId });
      }
      const filePath = `${fsPath}/${path}`;
      const dirPath = filePath.split("/").slice(0, -1).join("/");
      await fs.promises.mkdir(dirPath, { recursive: true });

      const storage = getStorageConnector(cloudStorageType as CloudStorageType);

      if (multipart) {
        await storage.downloadMultipartObject({ bucketName: bucket, objectKey: key, filePath, partSize }, credentials);
      } else {
        if (multipart) {
          await storage.downloadMultipartObject(
            { bucketName: bucket, objectKey: key, filePath, partSize },
            credentials,
          );
        } else {
          await storage.downloadObject({ bucketName: bucket, objectKey: key, filePath }, credentials);
        }
      }
      await sleep(2000);

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
      console.log(`download schedule error `, error);
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
  const { bucket, key, path, contentType, multipart, partSize, batchSize, credentials, cloudStorageType, ttl } =
    req.body as z.infer<typeof uploadSchema>;
  try {
    console.log(`upload request `);
    const storage = getStorageConnector(cloudStorageType as CloudStorageType);
    const filePath = `${fsPath}/${path}`;
    if (multipart) {
      await storage.uploadMultipartObject(
        {
          bucketName: bucket,
          objectKey: key,
          filePath,
          contentType,
          partSize,
          batchSize,
          ttl,
        },
        credentials,
      );
    } else {
      await storage.uploadObject(
        {
          bucketName: bucket,
          objectKey: key,
          filePath,
          contentType,
          ttl,
        },
        credentials,
      );
    }
    await sleep(2000);

    res.status(200).json({ bucket, key, path });
  } catch (error) {
    console.log(`upload error `, error);
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
    credentials,
    cloudStorageType,
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

    const storage = getStorageConnector(cloudStorageType as CloudStorageType);
    const filePath = `${fsPath}/${path}`;
    if (multipart) {
      await storage.uploadMultipartObject(
        {
          bucketName: bucket,
          objectKey: key,
          filePath,
          contentType,
          partSize,
          batchSize,
        },
        credentials,
      );
    } else {
      await storage.uploadObject(
        {
          bucketName: bucket,
          objectKey: key,
          filePath,
          contentType,
        },
        credentials,
      );
    }
    await sleep(2000);

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
    console.log(`upload schedule error `, error);
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
