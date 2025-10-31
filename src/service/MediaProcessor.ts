import { Ffmpeg, IClientCredentials, ICloudStorageCredentials, IFileInfo, Storage } from "@quinninc/ffmpeg-sdk";
import { Credentials, EventTypes, FileType, MediaFileStatusTypes, VariantConfig, VariantConfigTypes } from "./types";
import {
  COMPARE_CRF,
  DELTA_CRF_LOWER_RES,
  MAX_CRF,
  MIN_CRF,
  SCORE_ITERATIONS,
  SCORE_THRESHOLD,
  SIZE_ITERATIONS,
  contentTypeMap,
  extensionMap,
  fileConfigs,
  mediaFilePrefix,
  s3Bucket,
  tempPath,
} from "./config";
import { MediaProcessorUtils } from "./MediaProcessingUtil";
import { runProcess, sleep } from "utils/app";
import Files from "./files";
type MediaProcessorArgs = {
  mediaid: string;
  fileid: string;
  variantConfigType: VariantConfigTypes;
  storeCredentials: IClientCredentials;
  cloudStorageCredentials: ICloudStorageCredentials;
};
const MAX_VARIANT_RETRIES = 1;
export class MediaFileProcessor {
  private ffmpeg: Ffmpeg;
  private config: VariantConfig;
  private sourceid: string;
  private sourceInfo: IFileInfo;
  private utils: MediaProcessorUtils;
  private mediaid: string;
  private fileid: string;
  private variantConfigType: VariantConfigTypes;
  private cloudStorageCredentials: ICloudStorageCredentials;
  constructor(props: MediaProcessorArgs) {
    this.ffmpeg = new Ffmpeg();
    this.utils = new MediaProcessorUtils();
    this.mediaid = props.mediaid;
    this.fileid = props.fileid;
    this.variantConfigType = props.variantConfigType;
    this.cloudStorageCredentials = props.cloudStorageCredentials;
  }

  private processFull = async () => {
    const sourcePath = this.utils.getSourcePath(this.sourceid);
    const tmpDir = this.utils.getTmpDir(this.fileid);
    const hasAudio = this.sourceInfo.hasAudio;
    let audioPath: string | undefined;
    /**
     * If video has audio, extract audio and process videos without audio separately, and then
     * once video processing done, add back audio to video
     *
     * This is done to avoid audio and video sync issue in some videos
     */
    if (hasAudio) {
      audioPath = `${tmpDir}/original_audio.aac`;
      const commands = this.ffmpeg
        .process()
        .input(sourcePath)
        .audioCodec("aac")
        .audioBitrate("128k")
        .noVideo() // Only extract audio
        .output(audioPath)
        .get();
      await runProcess(commands, tempPath);
    }
    const extension = extensionMap[this.config.type];
    const output = this.utils.getOutputPath(this.fileid, extension);
    const videoOnlyOutput = `${tmpDir}/video_only_output.${extension}`;
    const maxKBitrate = this.getMaxKBitrate(this.sourceInfo);
    let chunks: { chunknumber: number; chunkPath: string }[] = [];
    if (this.sourceInfo.duration > 10) {
      const chunksDir = this.utils.getChunksDir(this.fileid);
      chunks = await this.utils.segment(sourcePath, chunksDir, "chunk");
    } else {
      chunks = [{ chunknumber: 0, chunkPath: sourcePath }];
    }
    const promises = chunks.map(async (chunk) => {
      const data = await Files.info(chunk.chunkPath);
      return {
        chunknumber: chunk.chunknumber,
        chunkPath: chunk.chunkPath,
        duration: data.duration,
        bitrate: data.avgbitrate,
        size: data.size,
        width: data.width,
        height: data.height,
      };
    });

    const chunksInfo = await Promise.all(promises);
    const biggestChunk = chunksInfo.sort((a, b) => b.duration - a.duration)[0];
    const optimisedParams = await this.getOptimisedParams(
      biggestChunk.chunknumber,
      biggestChunk.chunkPath,
      maxKBitrate,
    );

    const commands = this.ffmpeg
      .process()
      .input(sourcePath)
      .videoCodec(this.config.codec)
      .audioCodec("aac")
      .audioBitrate("128k")
      .movflags("faststart")
      .muted(this.config.muted)
      .crf(optimisedParams.crf)
      .crop(this.config.crop)
      .cropAr(this.config.crop_aspect_ratio)
      .scale(optimisedParams.resolution)
      .filter()
      .pixFmt("yuv420p")
      .output(hasAudio ? videoOnlyOutput : output)
      .get();
    await runProcess(commands, tempPath);
    if (hasAudio && audioPath) {
      const commands = this.ffmpeg
        .process()
        .input(videoOnlyOutput)
        .input(audioPath)
        .videoCodec("copy") // Copy video stream without re-encoding
        .audioCodec("copy") // Copy audio stream without re-encoding
        .muted(this.config.muted) // Apply muted setting if needed
        .movflags("faststart")
        .output(output)
        .get();
      await runProcess(commands, tempPath);
    }
  };

  private processShort = async () => {
    const sourcePath = this.utils.getSourcePath(this.sourceid);
    const extension = extensionMap[this.config.type];

    const maxKBitrate = this.getMaxKBitrate(this.sourceInfo);

    const output = this.utils.getOutputPath(this.fileid, extension);
    const { crf, resolution } = await this.getOptimisedParams(0, sourcePath, maxKBitrate, true);

    const commands = this.ffmpeg
      .process()
      .input(sourcePath)
      .videoCodec(this.config.codec)
      .muted(this.config.muted)
      .crf(crf)
      .seekStart(this.config.start_time)
      .seekDuration(this.config.duration)
      .movflags("faststart")
      .crop(this.config.crop)
      .cropAr(this.config.crop_aspect_ratio)
      .scale(resolution)
      .filter()
      .pixFmt("yuv420p")
      .output(output)
      .get();
    await runProcess(commands, tempPath);
  };

  private processImage = async () => {
    const sourcePath = this.utils.getSourcePath(this.sourceid);
    const extension = extensionMap[this.config.type];
    const output = this.utils.getOutputPath(this.fileid, extension);

    const resolutionNumber = this.utils.getResolutionNumber(this.sourceInfo);
    const processResolution = Math.min(resolutionNumber, this.config.resolution);

    const commands = this.ffmpeg
      .process()
      .input(sourcePath)
      .screenShot(this.config.seek_time || 0.1)
      .quality(this.config.quality)
      .crop(this.config.crop)
      .cropAr(this.config.crop_aspect_ratio)
      .resolution(processResolution)
      .filter()
      .output(output)
      .get();
    await runProcess(commands, tempPath);
  };

  processVariant = async (args: ProcessVariantArgs) => {
    const { sourceid, sourceInfo, config = {}, attempt = 0 } = args;
    try {
      this.config = { ...fileConfigs[this.variantConfigType], ...config };
      this.sourceid = sourceid;
      this.sourceInfo = sourceInfo;

      switch (this.variantConfigType) {
        case VariantConfigTypes.X264_FULL:
        case VariantConfigTypes.X265_FULL:
          await this.processFull();
          break;
        case VariantConfigTypes.X264_SHORT:
        case VariantConfigTypes.X265_SHORT:
          await this.processShort();
          break;
        case VariantConfigTypes.JPG_POSTER:
        case VariantConfigTypes.JPG_STORY:
          await this.processImage();
          break;
        default:
          throw new Error(`Unsupported variant type`);
      }
      await this.uploadVariant();
      return true;
    } catch (error) {
      if (
        error &&
        error.message &&
        error.message.toLowerCase().includes("write econnreset") &&
        attempt < MAX_VARIANT_RETRIES
      ) {
        await sleep(1000);
        await this.processVariant({ sourceid, sourceInfo, config, attempt: attempt + 1 });
      } else {
        return false;
      }
      return true;
    }
  };

  private uploadVariant = async () => {
    const config = fileConfigs[this.variantConfigType];
    const extension = extensionMap[config.type];
    await this.utils.upload({
      bucket: s3Bucket,
      key: `${this.mediaid}/${mediaFilePrefix}_${this.fileid}.${extension}`,
      contentType: contentTypeMap[config.type],
      inputFile: this.utils.getOutputPath(this.fileid, extension),
      multipart: config.type === FileType.video,
      cloudStorageCredentials: this.cloudStorageCredentials,
    });
  };
  private getOptimisedParams = async (
    chunkNumber: number,
    chunkPath: string,
    maxKBitrate: number,
    processSource?: boolean,
  ): Promise<{ crf: number; resolution: { width: number; height: number }; size: number }> => {
    const sourceChunk = chunkPath;
    let compareChunk = chunkPath;

    const tmpDir = this.utils.getTmpDir(this.fileid);

    const desiredCrf = this.config.quality;
    const desiredResNumber = this.config.resolution;
    const desiredScore = this.config.score;

    const sourceResNumber = this.utils.getResolutionNumber(this.sourceInfo);
    const processResolution = this.utils.getProcessResolution(this.sourceInfo, desiredResNumber);
    const processResNumber = this.utils.getResolutionNumber(processResolution);
    const processScore = this.utils.getProcessScore(desiredResNumber, desiredScore, processResNumber);

    if (sourceResNumber > processResNumber) {
      processSource = true;
    }
    if (processSource) {
      compareChunk = `${tmpDir}/chunk_${chunkNumber}_original.mp4`;
      const commands = this.ffmpeg
        .process()
        .input(chunkPath)
        .crf(COMPARE_CRF)
        .videoCodec(this.config.codec)
        .seekStart(this.config.start_time)
        .seekDuration(this.config.duration)
        .scale(processResolution)
        .filter()
        .output(compareChunk)
        .get();
      await runProcess(commands, tempPath);
    }

    let currentCrf = desiredCrf;
    let traversedBelowResolutions = true;
    let currentResolution = processResolution;
    let currentSize = 0;
    let iterations = 0;

    const processes: {
      crf: number;
      size: number;
      score: number;
      resolution: { width: number; height: number };
      bitrate: number;
    }[] = [];

    while (iterations < SCORE_ITERATIONS && currentCrf >= MIN_CRF && currentCrf <= MAX_CRF) {
      const iterationPath = `${tmpDir}/chunk_${chunkNumber}_${currentResolution.width}x${currentResolution.height}_${currentCrf}.mp4`;
      const commands = this.ffmpeg
        .process()
        .input(sourceChunk)
        .crf(currentCrf)
        .videoCodec(this.config.codec)
        .seekStart(this.config.start_time)
        .seekDuration(this.config.duration)
        .scale(currentResolution)
        .filter()
        .flag("vsync", "vfr")
        .output(iterationPath)
        .get();
      await runProcess(commands, tempPath);
      const data = await Files.info(iterationPath);
      currentSize = data.size;
      const { score } = await this.utils.getRelativeScore({
        originalFile: compareChunk,
        compareFile: iterationPath,
        scale: processResolution,
      });
      processes.push({
        crf: currentCrf,
        score,
        resolution: currentResolution,
        size: currentSize,
        bitrate: data.avgbitrate,
      });

      if (score > processScore - SCORE_THRESHOLD && score < processScore + SCORE_THRESHOLD) {
        if (traversedBelowResolutions) break;

        const nextResolution = this.utils.getNextLowestResolution(currentResolution);
        const nextResolutionCrf = currentCrf - DELTA_CRF_LOWER_RES;

        if (nextResolution && nextResolutionCrf >= MIN_CRF) {
          currentResolution = nextResolution;
          currentCrf = nextResolutionCrf;
          traversedBelowResolutions = true;
        } else {
          break;
        }
      } else {
        const deltaCrf = this.getDeltaCrf(score, processScore);
        const crf = currentCrf + deltaCrf;
        const isPreviouslyProcessed = processes.find((p) => p.crf === crf);
        if (isPreviouslyProcessed && deltaCrf === 1) {
          break;
        }
        currentCrf = crf;
      }
      iterations++;
    }
    // sort processes based on scores closer to desired score and size ascending
    processes.sort((a, b) => {
      let aScore = Math.abs(processScore - a.score);
      let bScore = Math.abs(processScore - b.score);

      if (aScore <= SCORE_THRESHOLD) {
        aScore = 0;
      }
      if (bScore <= SCORE_THRESHOLD) {
        bScore = 0;
      }

      return (aScore + 1) * a.size - (bScore + 1) * b.size;
    });

    const { crf, resolution, size, score, bitrate } = processes[0];

    if (bitrate < maxKBitrate) {
      return { crf, resolution, size };
    } else {
      iterations = 0;
      let currentCrf = crf;
      let currentSize = size;
      let currentBitrate = bitrate;
      let currentResolution = resolution;

      while (iterations < SIZE_ITERATIONS && currentBitrate > maxKBitrate && currentCrf <= MAX_CRF) {
        currentCrf += 2;
        const process = processes.find((p) => p.crf === currentCrf && p.resolution.width === currentResolution.width);
        if (process) {
          currentSize = process.size;
          currentBitrate = process.bitrate;
        } else {
          const iterationPath = `${tmpDir}/chunk_${chunkNumber}_${currentResolution.width}x${currentResolution.height}_${currentCrf}.mp4`;
          const commands = this.ffmpeg
            .process()
            .input(sourceChunk)
            .crf(currentCrf)
            .videoCodec(this.config.codec)
            .seekStart(this.config.start_time)
            .seekDuration(this.config.duration)
            .crop(this.config.crop)
            .cropAr(this.config.crop_aspect_ratio)
            .scale(currentResolution)
            .filter()
            .flag("vsync", "vfr")
            .output(iterationPath)
            .get();
          await runProcess(commands, tempPath);

          const data = await Files.info(iterationPath);
          currentSize = data.size;
          currentBitrate = data.avgbitrate;
        }
        iterations++;
      }

      if (currentBitrate < maxKBitrate) {
        return { crf: currentCrf, resolution: currentResolution, size: currentSize };
      } else {
        throw new Error(`Unable to find optimal size`);
      }
    }
  };

  private getDeltaCrf(currentScore: number, targetScore: number) {
    const delta = Math.abs(targetScore - currentScore);
    const sign = targetScore > currentScore ? -1 : 1;

    if (delta >= 6) return 4 * sign;
    if (delta >= 4) return 2 * sign;
    if (delta >= 2) return 1 * sign;
    return 1 * sign;
  }

  private getMaxKBitrate = (sourceData: IFileInfo) => {
    const maxSizeInKB = 20_000;
    const KBitrate = Math.floor((maxSizeInKB * 8) / sourceData.duration);
    return KBitrate;
  };
}

type ProcessVariantArgs = {
  sourceid: string;
  sourceInfo: IFileInfo;
  config: Partial<VariantConfig>;
  attempt: number;
};
