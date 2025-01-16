import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  UploadPartCommandOutput,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import fs from "fs";
import { CloudStorageConnector } from "./base";
import { IAWSCredentials } from "types";

const credentials = {
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION,
} as IAWSCredentials;
export class S3Connector implements CloudStorageConnector {
  async downloadObject(payload: { bucketName: string; objectKey: string; filePath: string }) {
    const s3Client = new S3Client(credentials);
    const { bucketName, objectKey } = payload;
    const params = {
      Bucket: bucketName,
      Key: objectKey,
    };
    const fileStream = fs.createWriteStream(payload.filePath);

    const command = new GetObjectCommand(params);
    const { Body } = await s3Client.send(command);

    if (Body) {
      fileStream.write(await Body.transformToByteArray());
    }

    fileStream.end();

    return new Promise<void>((resolve, reject) => {
      fileStream.on("finish", resolve);
      fileStream.on("error", reject);
    });
  }

  async uploadObject(
    payload: { bucketName: string; objectKey: string; filePath: string; contentType: string; ttl?: number },
    credentials?: IAWSCredentials,
  ) {
    const s3Client = new S3Client(credentials);
    const { bucketName, objectKey, filePath, contentType } = payload;
    const data: Buffer = await new Promise((resolve, reject) => {
      fs.readFile(filePath, (err, data) => {
        if (err) {
          reject(err);
        }
        resolve(data);
      });
    });

    const params = {
      Bucket: bucketName,
      Key: objectKey,
      Body: data,
      ContentType: contentType,
    };
    const command = new PutObjectCommand(params);
    await s3Client.send(command);
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
    credentials?: IAWSCredentials,
  ) {
    const s3Client = new S3Client(credentials);
    let { bucketName, objectKey, filePath, debug, partSize = 5 * 1024 * 1024, batchSize = 10 } = payload;

    const headObjectCommand = new HeadObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });

    const { ContentLength: fileSize } = await s3Client.send(headObjectCommand);
    if (!fileSize) throw new Error("ContentLength is undefined");

    partSize = Math.max(partSize, fileSize);
    if (debug) console.log(`File size: ${fileSize} bytes`);

    let bytesRead = 0;
    let partNumber = 1;

    const writeStream = fs.createWriteStream(filePath);

    const downloadPart = async (startByte: number, endByte: number) => {
      const getObjectCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        Range: `bytes=${startByte}-${endByte}`,
      });

      const { Body } = await s3Client.send(getObjectCommand);

      if (!Body) throw new Error(`Part ${partNumber} not found`);
      const chunk = await Body.transformToByteArray();
      // bytesRead += chunks.length;
      // writeStream.write(chunks);

      if (debug) console.log(`Downloaded part ${partNumber}`);
      partNumber++;
      return chunk;
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
    const chunks = await Promise.all(downloadPromises);
    writeStream.write(Buffer.concat(chunks));

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
      ttl?: number;
    },
    credentials?: IAWSCredentials,
  ) {
    const s3Client = new S3Client(credentials);
    let { bucketName, objectKey, filePath, contentType, debug, partSize = 5 * 1024 * 1024, batchSize = 10 } = payload;

    const { size: fileSize } = await fs.promises.stat(filePath);
    if (debug) console.log(`File size: ${fileSize} bytes`);

    partSize = Math.min(partSize, fileSize);

    // Step 1: Create a multipart upload
    const createMultipartUploadCommand = new CreateMultipartUploadCommand({
      Bucket: bucketName,
      Key: objectKey,
      ContentType: contentType,
    });

    const { UploadId } = await s3Client.send(createMultipartUploadCommand);

    // Step 2: Upload each part
    const fileStream = fs.createReadStream(filePath);
    let partNumber = 1;
    let currentPartSize = 0;
    let partBuffer: Buffer[] = [];
    const uploadPartCommands: UploadPartCommand[] = [];
    const uploadPartCommandOutput: UploadPartCommandOutput[] = [];

    for await (const chunk of fileStream) {
      currentPartSize += chunk.length;
      partBuffer.push(chunk);

      if (currentPartSize >= partSize) {
        const uploadPartCommand = new UploadPartCommand({
          Bucket: bucketName,
          Key: objectKey,
          UploadId,
          PartNumber: partNumber,
          Body: Buffer.concat(partBuffer),
          ContentLength: currentPartSize,
        });

        uploadPartCommands.push(uploadPartCommand);

        // Reset variables for the next part
        partNumber++;
        currentPartSize = 0;
        partBuffer = [];
      }
    }

    // Upload the last part if any remaining
    if (currentPartSize > 0) {
      const uploadPartCommand = new UploadPartCommand({
        Bucket: bucketName,
        Key: objectKey,
        UploadId,
        PartNumber: partNumber,
        Body: Buffer.concat(partBuffer),
        ContentLength: currentPartSize,
      });

      uploadPartCommands.push(uploadPartCommand);
    }

    //batch uploadPartCommands in 10
    const batchUploadPartCommands: UploadPartCommand[][] = [];

    for (let i = 0; i < uploadPartCommands.length; i += batchSize) {
      batchUploadPartCommands.push(uploadPartCommands.slice(i, i + batchSize));
    }

    try {
      for (const batchUploadPartCommand of batchUploadPartCommands) {
        const outputs = await Promise.all(
          batchUploadPartCommand.map((command) => {
            if (debug) {
              console.log(
                `Uploading Part ${command.input.PartNumber} (${Math.ceil(
                  (command.input.ContentLength || 0) / (1024 * 1024),
                )} MB)`,
              );
            }
            return s3Client.send(command);
          }),
        );
        uploadPartCommandOutput.push(...outputs);
      }

      const completeMultipartUploadCommand = new CompleteMultipartUploadCommand({
        Bucket: bucketName,
        Key: objectKey,
        UploadId,
        MultipartUpload: {
          Parts: uploadPartCommandOutput.map(({ ETag }, i) => ({
            ETag,
            PartNumber: i + 1,
          })),
        },
      });

      await s3Client.send(completeMultipartUploadCommand);
    } catch (err) {
      if (UploadId) {
        const abortCommand = new AbortMultipartUploadCommand({
          Bucket: bucketName,
          Key: objectKey,
          UploadId: UploadId,
        });

        await s3Client.send(abortCommand);
      }
      throw new Error("Error in uploading object to S3");
    }
  }
}
