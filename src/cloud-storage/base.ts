export abstract class CloudStorageConnector {
  abstract downloadObject(payload: { bucketName: string; objectKey: string; filePath: string }): Promise<void>;
  abstract uploadObject(payload: {
    bucketName: string;
    objectKey: string;
    filePath: string;
    contentType: string;
    ttl?: number;
  }): Promise<void>;
  abstract downloadMultipartObject(payload: {
    bucketName: string;
    objectKey: string;
    filePath: string;
    partSize?: number;
    batchSize?: number;
    debug?: boolean;
  }): Promise<void>;
  abstract uploadMultipartObject(payload: {
    bucketName: string;
    objectKey: string;
    filePath: string;
    contentType: string;
    partSize?: number;
    batchSize?: number;
    debug?: boolean;
    ttl?: number;
  }): Promise<void>;
}
