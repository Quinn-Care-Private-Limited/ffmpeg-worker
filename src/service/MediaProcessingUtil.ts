import { Ffmpeg, ICloudStorageCredentials, IFileInfo } from "@quinninc/ffmpeg-sdk";
import { FileType, IRelativeScore, MediaFileStatusTypes } from "./types";
import {
  PROCESS_RESOLUTIONS,
  mediaFilePrefix,
  CdnUrl,
  extensionMap,
  S3BucketUrl,
  tempPath,
  ffmpegPath,
  s3Bucket,
} from "./config";
import { runcmd, runProcess } from "utils/app";
import fs from "fs";
import { CloudStorageType, getStorageConnector } from "cloud-storage/connector";
import Files from "./files";
import path from "path";
export class MediaProcessorUtils {
  private ffmpeg: Ffmpeg;

  constructor() {
    this.ffmpeg = new Ffmpeg();
  }

  getSourceDir(sourceid: string) {
    return `source/${sourceid}`;
  }

  getSourcePath(sourceid: string) {
    return `source/${sourceid}/original.mp4`;
  }

  getMediaFileDir(fileid: string) {
    return `output/${fileid}`;
  }

  getTmpDir(fileid: string) {
    return `output/${fileid}/tmp`;
  }

  getChunksDir(fileid: string) {
    return `output/${fileid}/chunks`;
  }

  getOutputPath(fileid: string, extension: string) {
    return `output/${fileid}/output.${extension}`;
  }

  getMediaSourceUrl = (mediaid: string) => `${CdnUrl}${mediaid}/${mediaFilePrefix}_${mediaid}.${extensionMap.video}`;

  static getMediaFileUrl = (mediaid: string, fileid: string, type: FileType, version: number) =>
    `${CdnUrl}${mediaid}/${mediaFilePrefix}_${fileid}.${extensionMap[type]}?v=${version}`;

  getS3Url = (mediaid: string, fileid: string, type: FileType) =>
    `${S3BucketUrl}${mediaid}/${mediaFilePrefix}_${fileid}.${extensionMap[type]}`;

  getMediaSourceKey = (mediaid: string, type: FileType) =>
    `${mediaid}/${mediaFilePrefix}_${mediaid}.${extensionMap[type]}`;

  getMediaFileKey = (mediaid: string, fileid: string, type: FileType) =>
    `${mediaid}/${mediaFilePrefix}_${fileid}.${extensionMap[type]}`;

  async downloadFromSourceUrl(params: DownloadFromSourceUrlArgs) {
    const { sourceid, sourceurl, cloudStorageCredentials } = params;
    const sourcePath = this.getSourcePath(sourceid);
    const dirPath = `${tempPath}/${sourcePath.split("/").slice(0, -1).join("/")}`;
    const isExists = await fs.promises.stat(dirPath).catch(() => false);
    if (!isExists) {
      await fs.promises.mkdir(dirPath, { recursive: true });
    }
    await runcmd(`wget -O ${tempPath}/${sourcePath} "${sourceurl}"`);
    await this.upload({
      bucket: s3Bucket,
      key: `${sourceid}/${mediaFilePrefix}_${sourceid}.mp4`,
      inputFile: sourcePath,
      contentType: "video/mp4",
      cloudStorageCredentials,
    });
    return sourceid;
  }

  async downloadFromSource(params: DownloadFromSourceArgs) {
    const { mediaid, sourceid, cloudStorageCredentials, bucket } = params;
    const sourcePath = this.getSourcePath(sourceid);
    // check if file exists
    const fileExists = await Files.check({ path: sourcePath });
    if (fileExists.isExists) {
      return sourceid;
    }
    const filePath = `${tempPath}/${sourcePath}`;
    const dirPath = filePath.split("/").slice(0, -1).join("/");
    await fs.promises.mkdir(dirPath, { recursive: true });
    const storage = getStorageConnector(process.env.CLOUD_STORAGE as CloudStorageType);
    const key = `${mediaid}/${mediaFilePrefix}_${mediaid}.mp4`;
    console.log(`Downloading file from bucket: ${bucket} with key: ${key}`, cloudStorageCredentials);
    await storage.downloadMultipartObject({ bucketName: bucket, objectKey: key, filePath }, cloudStorageCredentials);
    return sourceid;
  }

  async getRelativeScore(payload: IRelativeScore) {
    const { originalFile, compareFile, scale, threads = 8, subsample = 10, model = "vmaf_v0.6.1" } = payload;

    const scale_filter = `scale=${scale?.width || -2}:${scale?.height || -2}`;

    // const { input1, input2, scale, model, subsample = 10, threads = 8 } = req.body as z.infer<typeof vmafSchema>;

    let cmd = `${ffmpegPath}ffmpeg`;
    const modelPath = path.join(__dirname, "..", "models", `${model}.json`);

    cmd += ` -i ${tempPath}/${compareFile} -i ${tempPath}/${originalFile} -lavfi "[0:v]${scale_filter}:flags=bicubic,setpts=PTS-STARTPTS[distorted];[1:v]${scale_filter}:flags=bicubic,setpts=PTS-STARTPTS[reference];[distorted][reference]libvmaf=model='path=${modelPath}':n_subsample=${subsample}:n_threads=${threads}" -f null -`;
    const data = await runcmd(cmd);
    let score = Math.floor(parseFloat(data.split("VMAF score:")[1]));
    score = isNaN(score) ? 0 : score;
    return { score };
  }

  async copy(inputFile: string, outputFile: string) {
    const commands = this.ffmpeg.process().input(inputFile).codec("copy").output(outputFile).get();
    await runProcess(commands, tempPath);
  }

  async getInfo(filePath: string, retry = 1): Promise<IFileInfo> {
    let cmd = `${ffmpegPath}ffprobe`;
    const path = `${tempPath}/${filePath}`;

    const extension = path.split(".").pop();
    const stream = ["mp3", "wav", "flac", "m4a", "aac", "opus"].includes(extension!) ? "a:0" : "v:0";

    const infoCmd = `${cmd} -v error -select_streams ${stream} -show_entries stream=duration,width,height,bit_rate,r_frame_rate -of default=noprint_wrappers=1 ${path}`;
    const sizeCmd = `${cmd} -v error -select_streams ${stream} -show_entries format=size -of default=noprint_wrappers=1 ${path}`;
    const rotationCmd = `${cmd} -v error -select_streams ${stream} -show_entries stream_side_data=rotation -of default=noprint_wrappers=1 ${path}`;
    const audioCmd = `${cmd} -v error -select_streams a -show_entries stream=codec_type -of default=noprint_wrappers=1 ${path}`;

    const [fileInfo, sizeData, rotationData, audioData] = await Promise.all([
      runcmd(infoCmd),
      runcmd(sizeCmd),
      runcmd(rotationCmd),
      runcmd(audioCmd),
    ]);
    const data: any = {};
    const lines = `${fileInfo}${sizeData}${rotationData}`.split("\n");
    // Check if file has audio
    data.hasAudio = audioData.includes("codec_type=audio");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const [key, value] = line.split("=");
      if (key && value) {
        if (key === "bit_rate") {
          data.avgbitrate = Math.floor(+value / 1000);
        } else if (key === "r_frame_rate") {
          const [num, den] = value.split("/");
          data.framerate = Math.round(+num / +den);
        } else if (key === "size") {
          data.size = Math.floor(+value / 1024);
        } else {
          data[key] = +value;
        }
      }
    }

    if (data.rotation === 90 || data.rotation === -90) {
      const { width, height } = data;
      data.width = height;
      data.height = width;
    }
    return data;
  }

  async segment({
    inputFile,
    outputDir,
    chunkPrefix,
    targetChunkDuration = 8,
    minChunkDuration = 4,
    dontCombine = false,
  }: SegmentArgs) {
    const commands = this.ffmpeg
      .process()
      .input(inputFile)
      .codec("copy")
      .noAudio()
      .segment(targetChunkDuration)
      .output(`${outputDir}/tmp_${chunkPrefix}_%d.mp4`)
      .get();
    await runProcess(commands, tempPath);
    const list = await Files.list({ path: outputDir });
    const segments = list
      .filter((item) => item.includes(`tmp_${chunkPrefix}_`))
      .map((item) => {
        const chunknumber = +item.split(`tmp_${chunkPrefix}_`)[1].split(".")[0];
        const chunkPath = `${outputDir}/${item}`;
        return {
          chunknumber,
          chunkPath,
        };
      })
      .sort((a, b) => a.chunknumber - b.chunknumber);

    const chunks: { chunknumber: number; chunkPath: string; duration: number }[] = await Promise.all(
      segments.map(async (segment) => {
        const data = await Files.info(segment.chunkPath);
        return { ...segment, duration: data.duration };
      }),
    );
    if (dontCombine) {
      /**
       * Don't combine the task, we only need largest chunk, and for processing we are anyway not segmenting video that are
       * less than 10 seconds, to chunk will alwyas be large enough for vmaf processing.
       */
      return chunks.map((chunk) => ({
        chunknumber: chunk.chunknumber,
        chunkPath: chunk.chunkPath,
        duration: chunk.duration,
      }));
    }

    // Merge chunks
    let chunkIndex = 0;
    let concatChunkDuration = 0;
    let concatChunks: { chunknumber: number; chunkPath: string; duration: number }[] = [];
    let processChunks: { chunknumber: number; chunkPath: string; duration: number }[][] = [];

    while (chunkIndex < chunks.length) {
      while (concatChunkDuration < minChunkDuration && chunkIndex < chunks.length) {
        const chunk = chunks[chunkIndex];
        concatChunks.push({ ...chunk });
        concatChunkDuration += chunk.duration;
        chunkIndex++;
      }
      processChunks.push([...concatChunks]);
      concatChunks = [];
      concatChunkDuration = 0;
    }

    if (processChunks.length > 1) {
      const lastProcessChunks = processChunks[processChunks.length - 1];
      if (lastProcessChunks.length === 1 && lastProcessChunks[0].duration < minChunkDuration) {
        processChunks[processChunks.length - 2].push({ ...lastProcessChunks[0] });
        processChunks.pop();
      }
    }

    const outputChunks = await Promise.all(
      processChunks.map(async (mergeChunks, index) => {
        const chunkPath = `${outputDir}/${chunkPrefix}_${index}.mp4`;
        if (mergeChunks.length === 1) {
          const chunk = mergeChunks[0];
          await this.copy(chunk.chunkPath, chunkPath);
          return { chunknumber: index, chunkPath, duration: chunk.duration };
        } else {
          const chunkPaths = mergeChunks.map((chunk) => chunk.chunkPath);
          await this.concat(chunkPaths, chunkPath);
          return {
            chunknumber: index,
            chunkPath,
            duration: mergeChunks.reduce((acc, chunk) => acc + chunk.duration, 0),
          };
        }
      }),
    );
    return outputChunks;
  }

  async crfEncode(inputFile: string, outputFile: string, crf: number, resolution: number) {
    const commands = this.ffmpeg
      .process()
      .input(inputFile)
      .videoCodec("libx264")
      .audioCodec("aac")
      .audioBitrate("128k")
      .crf(crf)
      .resolution(resolution)
      .output(outputFile)
      .get();
    await runProcess(commands, tempPath);
  }

  getResolutionNumber(resolution: { width: number; height: number }) {
    return Math.min(resolution.width, resolution.height);
  }

  getAspectRatio(resolution: { width: number; height: number }) {
    return resolution.width / resolution.height;
  }

  getScaledResolution(resolutionNumber: number, resolution: { width: number; height: number }) {
    const aspectRatio = this.getAspectRatio(resolution);
    if (resolution.width > resolution.height) {
      return { width: Math.floor(resolutionNumber * aspectRatio), height: resolutionNumber };
    } else {
      return { width: resolutionNumber, height: Math.floor(resolutionNumber / aspectRatio) };
    }
  }

  getProcessResolution(sourceResolution: { width: number; height: number }, desiredResNumber: number) {
    const sourceResNumber = this.getResolutionNumber(sourceResolution);
    const resNumber = Math.min(sourceResNumber, desiredResNumber);

    const resolutions = PROCESS_RESOLUTIONS.filter((item) => item <= resNumber);
    if (resolutions.length) {
      const resNumber = resolutions[0];
      return this.getScaledResolution(resNumber, sourceResolution);
    } else {
      const resNumber = PROCESS_RESOLUTIONS[PROCESS_RESOLUTIONS.length - 1];
      return this.getScaledResolution(resNumber, sourceResolution);
    }
  }

  getNextLowestResolution(currentResolution: { width: number; height: number }) {
    const resNumber = this.getResolutionNumber(currentResolution);
    const resolutions = PROCESS_RESOLUTIONS.filter((item) => item < resNumber);
    if (resolutions.length > 1) {
      const resNumber = resolutions[1];
      return this.getScaledResolution(resNumber, currentResolution);
    }
    return null;
  }

  getProcessScore(desiredResNumber: number, desiredScore: number = 90, processResNumber: number) {
    if (desiredResNumber > processResNumber) {
      return desiredScore + 5;
    }
    return desiredScore;
  }
  async concat(inputFiles: string[], outputFile: string) {
    const path = await Files.path();
    const concatFileContent = inputFiles.map((item) => `file '${path}/${item}'`).join("\n");
    const concatFilePath = outputFile.replace(".mp4", ".txt");
    await Files.create({ path: concatFilePath, data: concatFileContent });

    const commands = this.ffmpeg
      .process()
      .format("concat")
      .flag("safe", "0")
      .input(concatFilePath)
      .codec("copy")
      .movflags("faststart") // Ensure moov atom is at the beginning
      .output(outputFile)
      .get();
    await runProcess(commands, tempPath);
  }
  async upload(args: UploadArgs) {
    const { inputFile, bucket, key, contentType, multipart, partSize, batchSize, ttl, cloudStorageCredentials } = args;
    const storage = getStorageConnector(process.env.CLOUD_STORAGE as CloudStorageType);
    const filePath = `${tempPath}/${inputFile}`;
    if (multipart) {
      console.log(`Multipart upload`);
      await storage.uploadMultipartObject(
        {
          bucketName: bucket,
          objectKey: key,
          filePath,
          contentType,
          partSize,
          batchSize,
          ttl,
        },
        cloudStorageCredentials,
      );
    } else {
      console.log(`Single upload`);
      await storage.uploadObject(
        {
          bucketName: bucket,
          objectKey: key,
          filePath,
          contentType,
          ttl,
        },
        cloudStorageCredentials,
      );
    }
  }
}

type DownloadFromSourceArgs = {
  mediaid: string;
  sourceid: string;
  cloudStorageCredentials: ICloudStorageCredentials;
  bucket: string;
};

type DownloadFromSourceUrlArgs = {
  sourceid: string;
  sourceurl: string;
  cloudStorageCredentials: ICloudStorageCredentials;
};

type UploadArgs = {
  inputFile: string;
  bucket: string;
  key: string;
  contentType: string;
  multipart?: boolean;
  partSize?: number;
  batchSize?: number;
  ttl?: number;
  cloudStorageCredentials: ICloudStorageCredentials;
};

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type SegmentArgs = {
  inputFile: string;
  outputDir: string;
  chunkPrefix: string;
  targetChunkDuration?: number;
  minChunkDuration?: number;
  dontCombine?: boolean;
};
