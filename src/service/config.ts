import { VariantConfigTypes, VariantConfig, FileType, ResolutionTypes, CodecTypes } from "./types";

export const s3Bucket = "videocdn.quinn.live";
export const dynamoDbTableName = "quinnlive_media";
export const mediaFilePrefix = "quinn";
export const tempPath = process.env.TEMP_PATH || "/tmp";
export const CdnUrl = `https://videocdn.quinn.live/`;
export const S3BucketUrl = `https://storage.googleapis.com/${s3Bucket}/`;
export const ffmpegPath = process.env.FFMPEG_PATH || "";
export const extensionMap = {
  video: "mp4",
  image: "jpg",
  gif: "gif",
  webp: "webp",
  avif: "avif",
};

export const contentTypeMap = {
  video: "video/mp4",
  image: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
};

export const fileConfigs: Record<VariantConfigTypes, VariantConfig> = {
  X264_FULL: {
    type: FileType.video,
    quality: 30,
    resolution: ResolutionTypes["1080p"],
    score: 85,
    codec: CodecTypes.X264,
  },
  X264_SHORT: {
    type: FileType.video,
    quality: 30,
    duration: 3,
    start_time: 1,
    muted: true,
    resolution: ResolutionTypes["480p"],
    score: 85,
    codec: CodecTypes.X264,
  },
  JPG_POSTER: {
    type: FileType.image,
    seek_time: 2,
    quality: 15,
    resolution: ResolutionTypes["480p"],
  },
  JPG_STORY: {
    type: FileType.image,
    seek_time: 2,
    quality: 32,
    resolution: ResolutionTypes["360p"],
    crop_aspect_ratio: "1:1",
  },
  X265_FULL: {
    type: FileType.video,
    quality: 30,
    resolution: ResolutionTypes["1080p"],
    score: 85,
    codec: CodecTypes.X265,
  },
  X265_SHORT: {
    type: FileType.video,
    quality: 30,
    duration: 3,
    start_time: 1,
    muted: true,
    resolution: ResolutionTypes["480p"],
    score: 85,
    codec: CodecTypes.X265,
  },
  WEBP_SHORT: {
    type: FileType.webp,
    quality: 24,
    resolution: ResolutionTypes["360p"],
    duration: 3,
    muted: true,
    start_time: 1,
  },
  WEBP_FULL: {
    type: FileType.webp,
    quality: 24,
    resolution: ResolutionTypes["480p"],
  },
  AVIF_SHORT: {
    type: FileType.avif,
    quality: 24,
    resolution: ResolutionTypes["360p"],
    duration: 3,
    muted: true,
    start_time: 1,
  },
  AVIF_FULL: {
    type: FileType.avif,
    quality: 24,
    resolution: ResolutionTypes["480p"],
  },
};

export const PROCESS_RESOLUTIONS = [1080, 720, 480, 360];
export const MIN_CRF = 20;
export const MAX_CRF = 50;

export const SCORE_THRESHOLD = 1;
export const DELTA_CRF_LOWER_RES = 4;
export const COMPARE_CRF = 16;

export const SCORE_ITERATIONS = 10;
export const SIZE_ITERATIONS = 20;
