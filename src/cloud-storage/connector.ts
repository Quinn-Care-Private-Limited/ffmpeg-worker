import { CloudStorageType } from "types";
import { CloudStorageConnector } from "./base";
import { GCStorageConnector } from "./gcs";
import { S3Connector } from "./s3";

export const getStorageConnector = (type: CloudStorageType): CloudStorageConnector => {
  switch (type) {
    case CloudStorageType.S3:
      return new S3Connector();
    case CloudStorageType.GCS:
      return new GCStorageConnector();
    default:
      throw new Error(`Invalid cloud storage type: ${type}`);
  }
};
