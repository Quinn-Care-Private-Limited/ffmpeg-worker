import { CloudStorageConnector } from "./base";

export class GCPStorageConnector implements CloudStorageConnector {
  downloadObject(payload: { bucketName: string; objectKey: string; filePath: string }): Promise<void> {
    throw new Error("Method not implemented.");
  }
  uploadObject(payload: {
    bucketName: string;
    objectKey: string;
    filePath: string;
    contentType: string;
  }): Promise<void> {
    throw new Error("Method not implemented.");
  }
  downloadMultipartObject(payload: {
    bucketName: string;
    objectKey: string;
    filePath: string;
    partSize?: number | undefined;
  }): Promise<void> {
    throw new Error("Method not implemented.");
  }
  uploadMultipartObject(payload: {
    bucketName: string;
    objectKey: string;
    filePath: string;
    contentType: string;
    partSize?: number | undefined;
    batchSize?: number | undefined;
  }): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
