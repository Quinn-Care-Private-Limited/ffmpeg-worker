import { Storage, TransferManager } from "@google-cloud/storage";
import { CloudStorageConnector } from "./base";
import fs from "fs";
import { IGCPCredentials } from "types";
import { ConfigMetadata } from "@google-cloud/storage/build/cjs/src/resumable-upload";

const credentials = JSON.parse(process.env.GCP_CREDENTIALS || "{}") as IGCPCredentials;

credentials.private_key = credentials.private_key?.replace(/\\n/g, "\n");
export class GCStorageConnector implements CloudStorageConnector {
  async downloadObject(payload: { bucketName: string; objectKey: string; filePath: string }): Promise<void> {
    const storage = new Storage({
      credentials,
    });
    const { bucketName, objectKey, filePath } = payload;
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(objectKey);

    const [exists] = await file.exists();

    if (!exists) {
      throw new Error(`File ${objectKey} does not exist in bucket ${bucketName}`);
    }

    const readStream = file.createReadStream();
    const writeStream = fs.createWriteStream(filePath);

    readStream.pipe(writeStream);

    return new Promise<void>((resolve, reject) => {
      writeStream.on("finish", () => {
        resolve();
      });

      writeStream.on("error", (err) => {
        console.log(err);
        reject("Error downloading video");
      });
    });
  }

  async uploadObject(payload: {
    bucketName: string;
    objectKey: string;
    filePath: string;
    contentType: string;
    ttl?: number;
  }): Promise<void> {
    const storage = new Storage({
      credentials,
    });

    const { bucketName, objectKey, filePath, contentType } = payload;
    const bucket = storage.bucket(bucketName);
    const metadata: ConfigMetadata = {};
    if (payload.ttl) {
      metadata.cacheControl = `public, max-age=${payload.ttl}`;
    }
    await bucket.upload(filePath, {
      destination: objectKey,
      contentType,
      metadata,
    });
  }

  async downloadMultipartObject(payload: {
    bucketName: string;
    objectKey: string;
    filePath: string;
    partSize?: number;
    batchSize?: number;
    debug?: boolean;
  }): Promise<void> {
    const storage = new Storage({
      credentials,
    });

    let { bucketName, objectKey, filePath, debug, partSize = 5 * 1024 * 1024, batchSize = 10 } = payload;

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(objectKey);
    const fileExists = await file.exists();

    if (!fileExists[0]) {
      if (debug) {
        console.error(`File ${objectKey} does not exist in bucket ${bucketName}`);
      }
      throw new Error(`File ${objectKey} does not exist in bucket ${bucketName}`);
    }

    let fileSize = (await file.getMetadata())[0].size;
    if (!fileSize) throw new Error("File size is undefined");

    fileSize = +fileSize;
    partSize = Math.min(partSize, fileSize);

    if (debug) console.log(`File size: ${fileSize} bytes`);

    let bytesRead = 0;
    let partNumber = 1;

    const writeStream = fs.createWriteStream(filePath);

    const downloadPart = async (startByte: number, endByte: number): Promise<Buffer[]> => {
      return new Promise((resolve, reject) => {
        const readStream = file.createReadStream({
          start: startByte,
          end: endByte,
        });

        const stream: Buffer[] = [];

        readStream.on("data", (chunk) => {
          // bytesRead += chunk.length;
          // writeStream.write(chunk);
          if (!chunk) reject(`Part ${partNumber} not found`);
          stream.push(chunk);
        });

        readStream.on("end", () => {
          if (debug) console.log(`Downloaded part ${partNumber}`);
          partNumber++;
          resolve(stream);
        });

        readStream.on("error", (error) => {
          if (debug) console.error(`Error downloading part ${partNumber}:`, error);
          reject("Error downloading video");
        });
      });
    };

    const downloadPromises: Promise<Buffer[]>[] = [];

    while (bytesRead < fileSize) {
      const startByte = bytesRead;
      const endByte = Math.min(bytesRead + partSize - 1, fileSize - 1);

      bytesRead += endByte - startByte + 1;

      downloadPromises.push(downloadPart(startByte, endByte));

      if (downloadPromises.length >= batchSize) {
        // Wait for the current batch to complete before starting a new one
        const streams = await Promise.all(downloadPromises);
        for (const stream of streams) {
          writeStream.write(Buffer.concat(stream));
        }

        downloadPromises.length = 0; // Clear the array for the next batch
      }
    }

    // Wait for any remaining parts to be downloaded
    const streams = await Promise.all(downloadPromises);

    for (const stream of streams) {
      writeStream.write(Buffer.concat(stream));
    }

    // bucket.combine()

    writeStream.end();
    if (debug) console.log("Download complete");
  }

  async uploadMultipartObject(payload: {
    bucketName: string;
    objectKey: string;
    filePath: string;
    contentType: string;
    partSize?: number;
    batchSize?: number;
    debug?: boolean;
    ttl?: number;
  }): Promise<void> {
    const storage = new Storage();
    let { bucketName, objectKey, filePath, partSize = 5 * 1024 * 1024, batchSize = 10, ttl } = payload;

    const stats = fs.statSync(filePath);
    const fileSizeInBytes = stats.size;
    const fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);

    /**
     * If file size is less than 5MB, use simple upload, because multipart upload requires minimum 5MB chunk size
     */
    if (fileSizeInMegabytes <= 5) {
      return await this.uploadObject(payload);
    }

    /**
     * Minimum chunk size is 5MB, you can not upload a file in chunks smaller than 5MB
     */
    // Creates a transfer manager client
    const transferManager = new TransferManager(storage.bucket(bucketName));
    const headers: {
      [key: string]: string;
    } = {};
    if (ttl) {
      headers["Cache-Control"] = `"public, max-age=${ttl}"`;
    }
    await transferManager.uploadFileInChunks(filePath, {
      chunkSizeBytes: partSize,
      concurrencyLimit: batchSize,
      headers,
    });
  }
}
