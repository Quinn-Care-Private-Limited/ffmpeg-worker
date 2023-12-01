import { CloudStorageConnector } from "./base";
import { GCPStorageConnector } from "./gcp";
import { S3Connector } from "./s3";

export enum CloudStorageType {
  S3 = "s3",
  GCP = "gcp",
}

export const getStorageConnector = (type: CloudStorageType): CloudStorageConnector => {
  switch (type) {
    case CloudStorageType.S3:
      return new S3Connector();
    case CloudStorageType.GCP:
      return new GCPStorageConnector();
    default:
      throw new Error(`Unknown cloud storage type: ${type}`);
  }
};
