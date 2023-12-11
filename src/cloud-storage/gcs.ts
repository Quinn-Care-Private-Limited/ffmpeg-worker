import { Storage } from "@google-cloud/storage";
import { CloudStorageConnector } from "./base";
import fs from "fs";
import { IGCPCredentials } from "types";

export class GCStorageConnector implements CloudStorageConnector {
  async downloadObject(
    payload: { bucketName: string; objectKey: string; filePath: string },
    credentials?: IGCPCredentials,
  ): Promise<void> {
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
        reject("Error downloading video");
      });
    });
  }

  async uploadObject(
    payload: {
      bucketName: string;
      objectKey: string;
      filePath: string;
      contentType: string;
    },
    credentials?: IGCPCredentials,
  ): Promise<void> {
    const storage = new Storage({
      credentials,
    });

    const { bucketName, objectKey, filePath, contentType } = payload;
    const bucket = storage.bucket(bucketName);

    await bucket.upload(filePath, {
      destination: objectKey,
      contentType,
    });
  }

  async downloadMultipartObject(
    payload: {
      bucketName: string;
      objectKey: string;
      filePath: string;
      partSize?: number;
      batchSize?: number;
      debug?: boolean;
    },
    credentials?: IGCPCredentials,
  ): Promise<void> {
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
      return;
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

  async uploadMultipartObject(
    payload: {
      bucketName: string;
      objectKey: string;
      filePath: string;
      contentType: string;
      partSize?: number;
      batchSize?: number;
      debug?: boolean;
    },
    credentials?: IGCPCredentials,
  ): Promise<void> {
    const storage = new Storage({
      credentials,
    });
    let { bucketName, objectKey, filePath, contentType, debug, partSize = 5 * 1024 * 1024, batchSize = 10 } = payload;

    const bucket = storage.bucket(bucketName);

    const { size: fileSize } = await fs.promises.stat(filePath);
    if (debug) console.log(`File size: ${fileSize} bytes`);
    partSize = Math.min(partSize, fileSize);

    let bytesRead = 0;
    let partNumber = 1;

    const uploadPart = async (startByte: number, endByte: number): Promise<string> => {
      const partStream = fs.createReadStream(filePath, {
        start: startByte,
        end: endByte,
      });

      const file = bucket.file(objectKey);
      const writeStream = file.createWriteStream({
        isPartialUpload: true,
        chunkSize: endByte - startByte + 1,
        resumable: false, // Disable resumable uploads for simplicity
        metadata: {
          contentType,
        },
      });

      return new Promise((resolve, reject) => {
        partStream.pipe(writeStream);

        writeStream.on("finish", async () => {
          if (debug)
            console.log(`Uploading Part ${partNumber} (${Math.ceil((endByte - startByte || 0) / (1024 * 1024))} MB)`);
          partNumber++;
          resolve(file.name);
        });

        writeStream.on("error", (error) => {
          reject(error);
        });
      });
    };

    const uploadPromises: Promise<string>[] = [];

    while (bytesRead < fileSize) {
      const startByte = bytesRead;
      const endByte = Math.min(bytesRead + partSize - 1, fileSize - 1);

      uploadPromises.push(uploadPart(startByte, endByte));

      if (uploadPromises.length >= batchSize) {
        // Wait for the current batch to complete before starting a new one
        const etags = await Promise.all(uploadPromises);
        uploadPromises.length = 0; // Clear the array for the next batch
      }

      bytesRead += partSize;
    }

    // Wait for any remaining parts to be uploaded
    const etags = await Promise.all(uploadPromises);

    // If needed, you can perform additional actions with the etags here

    if (debug) console.log("Upload complete");
  }
}
