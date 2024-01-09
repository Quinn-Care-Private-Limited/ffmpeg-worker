import { ICloudStorageCredentials } from "types";

export abstract class CloudStorageConnector {
  abstract downloadObject(
    payload: { bucketName: string; objectKey: string; filePath: string },
    credentials?: ICloudStorageCredentials,
  ): Promise<void>;
  abstract uploadObject(
    payload: {
      bucketName: string;
      objectKey: string;
      filePath: string;
      contentType: string;
      ttl?: number;
    },
    credentials?: ICloudStorageCredentials,
  ): Promise<void>;
  abstract downloadMultipartObject(
    payload: {
      bucketName: string;
      objectKey: string;
      filePath: string;
      partSize?: number;
      batchSize?: number;
      debug?: boolean;
    },
    credentials?: ICloudStorageCredentials,
  ): Promise<void>;
  abstract uploadMultipartObject(
    payload: {
      bucketName: string;
      objectKey: string;
      filePath: string;
      contentType: string;
      partSize?: number;
      batchSize?: number;
      debug?: boolean;
      ttl?: number;
    },
    credentials?: ICloudStorageCredentials,
  ): Promise<void>;
}
