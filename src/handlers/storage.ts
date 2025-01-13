import fs from "fs";
import cuid2 from "@paralleldrive/cuid2";
import { CloudStorageType, getStorageConnector } from "cloud-storage/connector";
import { z } from "zod";
import { IHandlerResponse, WebhookType } from "types";
import { getWebhookResponsePayload, sendWebhook } from "utils";

const fsPath = process.env.FS_PATH || "";
const cloudStorageType = process.env.CLOUD_STORAGE_TYPE as CloudStorageType;

export const downloadSchema = z.object({
  bucket: z.string(),
  key: z.string(),
  path: z.string(),
  multipart: z.boolean().optional(),
  partSize: z.number().optional(),
});

export const downloadHandler = async (body: z.infer<typeof downloadSchema>): Promise<IHandlerResponse> => {
  const { bucket, key, path, multipart, partSize } = body as z.infer<typeof downloadSchema>;
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

    return {
      status: 200,
      data: {},
    };
  } catch (error) {
    console.log(error);
    return {
      status: 400,
      data: {
        error: "Error downloading file",
      },
    };
  }
};

export const downloadScheduleSchema = downloadSchema.extend({
  async: z.boolean().optional(),
  callbackId: z.string().optional(),
  callbackUrl: z.string(),
  callbackMeta: z.record(z.any()).optional(),
});

export const downloadScheduleHandler = async (
  body: z.infer<typeof downloadScheduleSchema>,
  req?: {
    baseUrl: string;
    method: string;
    originalUrl: string;
  },
): Promise<IHandlerResponse> => {
  const {
    bucket,
    key,
    path,
    multipart,
    partSize,
    callbackId = cuid2.createId(),
    callbackUrl = "",
    callbackMeta = {},
  } = body as z.infer<typeof downloadScheduleSchema>;
  const start = Date.now();

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
      responsePayload: req && getWebhookResponsePayload(req, 200, Date.now() - start),
    });

    return {
      status: 200,
      data: {
        bucket,
        key,
        path,
      },
    };
  } catch (error) {
    console.log(error);
    await sendWebhook(callbackUrl, {
      callbackId,
      callbackMeta,
      type: WebhookType.STORAGE_DOWNLOAD,
      success: false,
      data: "Error downloading file",
      responsePayload: req && getWebhookResponsePayload(req, 400, Date.now() - start),
    });

    return {
      status: 400,
      data: {
        error: "Error downloading file",
      },
    };
  }
};

export const uploadSchema = z.object({
  bucket: z.string(),
  key: z.string(),
  path: z.string(),
  contentType: z.string(),
  multipart: z.boolean().optional(),
  partSize: z.number().optional(),
  batchSize: z.number().optional(),
  ttl: z.number().optional(),
});

export const uploadHandler = async (body: z.infer<typeof uploadSchema>): Promise<IHandlerResponse> => {
  const { bucket, key, path, contentType, multipart, partSize, batchSize, ttl } = body as z.infer<typeof uploadSchema>;
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

    return {
      status: 200,
      data: {
        bucket,
        key,
        path,
      },
    };
  } catch (error) {
    console.log(error);
    return {
      status: 400,
      data: {
        error: error.message,
      },
    };
  }
};

export const uploadScheduleSchema = uploadSchema.extend({
  async: z.boolean().optional(),
  callbackId: z.string().optional(),
  callbackUrl: z.string(),
  callbackMeta: z.record(z.any()).optional(),
});

export const uploadScheduleHandler = async (
  body: z.infer<typeof uploadScheduleSchema>,
  req?: {
    baseUrl: string;
    method: string;
    originalUrl: string;
  },
): Promise<IHandlerResponse> => {
  const {
    bucket,
    key,
    path,
    contentType,
    multipart,
    partSize,
    batchSize,
    ttl,
    callbackId = cuid2.createId(),
    callbackUrl = "",
    callbackMeta = {},
  } = body as z.infer<typeof uploadScheduleSchema>;
  const start = Date.now();
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
      responsePayload: req && getWebhookResponsePayload(req, 200, Date.now() - start),
    });

    return {
      status: 200,
      data: {
        bucket,
        key,
        path,
      },
    };
  } catch (error) {
    console.log(error);
    await sendWebhook(callbackUrl, {
      callbackId,
      callbackMeta,
      type: WebhookType.STORAGE_UPLOAD,
      success: false,
      data: "Error uploading file",
      responsePayload: req && getWebhookResponsePayload(req, 400, Date.now() - start),
    });

    return {
      status: 400,
      data: {
        error: "Error uploading file",
      },
    };
  }
};
