import { Storage } from "@google-cloud/storage";
import { CloudStorageConnector } from "./base";
import fs from "fs";

export class GCPStorageConnector implements CloudStorageConnector {
  async downloadObject(payload: { bucketName: string; objectKey: string; filePath: string }): Promise<void> {
    const { bucketName, objectKey, filePath } = payload;

    const storage = new Storage();
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

  async uploadObject(payload: {
    bucketName: string;
    objectKey: string;
    filePath: string;
    contentType: string;
  }): Promise<void> {
    const { bucketName, objectKey, filePath, contentType } = payload;
    const storage = new Storage();
    const bucket = storage.bucket(bucketName);

    await bucket.upload(filePath, {
      destination: objectKey,
      contentType,
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
    const { bucketName, objectKey, filePath, debug, partSize = 5 * 1024 * 1024, batchSize = 10 } = payload;
    const storage = new Storage();

    const file = storage.bucket(bucketName).file(objectKey);
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

    if (debug) console.log(`File size: ${fileSize} bytes`);

    let bytesRead = 0;
    let partNumber = 1;

    const writeStream = fs.createWriteStream(filePath);

    const downloadPart = async (startByte: number, endByte: number): Promise<Uint8Array> => {
      return new Promise((resolve, reject) => {
        const readStream = file.createReadStream({
          start: startByte,
          end: endByte,
        });

        let streamchunk: any;

        readStream.on("data", (chunk) => {
          // bytesRead += chunk.length;
          // writeStream.write(chunk);
          if (!chunk) reject(`Part ${partNumber} not found`);
          streamchunk = chunk;
        });

        readStream.on("end", () => {
          if (debug) console.log(`Downloaded part ${partNumber}`);
          partNumber++;
          resolve(streamchunk);
        });

        readStream.on("error", (error) => {
          if (debug) console.error(`Error downloading part ${partNumber}:`, error);
          reject("Error downloading video");
        });
      });
    };

    const downloadPromises: Promise<Uint8Array>[] = [];

    while (bytesRead < fileSize) {
      const startByte = bytesRead;
      const endByte = Math.min(bytesRead + partSize - 1, fileSize - 1);

      bytesRead += endByte - startByte + 1;

      downloadPromises.push(downloadPart(startByte, endByte));

      if (downloadPromises.length >= batchSize) {
        // Wait for the current batch to complete before starting a new one
        const chunks = await Promise.all(downloadPromises);
        writeStream.write(Buffer.concat(chunks));
        downloadPromises.length = 0; // Clear the array for the next batch
      }
    }

    // Wait for any remaining parts to be downloaded
    await Promise.all(downloadPromises);

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
  }): Promise<void> {
    const { bucketName, objectKey, filePath, contentType, debug, partSize = 5 * 1024 * 1024, batchSize = 10 } = payload;
    const storage = new Storage();

    const file = storage.bucket(bucketName).file(objectKey);

    const stat = await fs.promises.stat(filePath);
    const fileSize = stat.size;

    if (debug) {
      console.log(`File size: ${fileSize} bytes`);
    }

    let bytesRead = 0;
    let partNumber = 1;
    const readStream = fs.createReadStream(filePath, { highWaterMark: partSize });

    const uploadPart = async (partData: Buffer): Promise<void> => {
      return new Promise((resolve, reject) => {
        const partUploadStream = file.createWriteStream({
          resumable: true,
          metadata: {
            contentType,
          },
        });

        partUploadStream.on("finish", () => {
          if (debug) {
            console.log(`Uploaded part ${partNumber}`);
          }
          partNumber++;
          resolve();
        });

        partUploadStream.on("error", (error) => {
          if (debug) {
            console.error(`Error uploading part ${partNumber}:`, error);
          }
          reject("Error uploading video");
        });

        partUploadStream.write(partData);
        partUploadStream.end();
      });
    };

    for await (const chunk of readStream) {
      bytesRead += chunk.length;
      const remainingBytes = fileSize - bytesRead;
      const partData = chunk.slice();

      if (remainingBytes < partSize) {
        // If it's the last part, upload it immediately without waiting for the batch
        await uploadPart(partData);
      } else {
        // Upload parts in parallel in batches
        const batchPromises: Promise<void>[] = [];
        for (let i = 0; i < batchSize; i++) {
          batchPromises.push(uploadPart(partData));
        }

        await Promise.all(batchPromises);
      }
    }
  }
}
