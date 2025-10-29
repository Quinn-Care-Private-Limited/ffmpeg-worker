export enum FileType {
  video = "video",
  image = "image",
  gif = "gif",
  webp = "webp",
  avif = "avif",
}

export enum ResolutionTypes {
  "1080p" = 1080,
  "720p" = 720,
  "480p" = 480,
  "360p" = 360,
}

export enum MediaFileStatusTypes {
  CREATED = "created",
  PROCESSING = "processing",
  SUCCESS = "success",
  FAILED = "failed",
}

export enum VariantConfigTypes {
  X264_FULL = "X264_FULL",
  X264_SHORT = "X264_SHORT",
  JPG_POSTER = "JPG_POSTER",
  JPG_STORY = "JPG_STORY",
  X265_FULL = "X265_FULL",
  X265_SHORT = "X265_SHORT",
  WEBP_SHORT = "WEBP_SHORT",
  WEBP_FULL = "WEBP_FULL",
  AVIF_FULL = "AVIF_FULL",
  AVIF_SHORT = "AVIF_SHORT",
}

export enum CodecTypes {
  X264 = "libx264",
  X265 = "libx265",
  VP9 = "vp9",
}

export type VariantConfig = {
  type: FileType;
  generate_subtitles?: boolean;
  quality: number;
  resolution: ResolutionTypes;
  score?: number;
  codec?: CodecTypes;
  duration?: number;
  start_time?: number;
  muted?: boolean;
  seek_time?: number;
  crop_aspect_ratio?: string;
  crop?: {
    width: number;
    height: number;
    x: number;
    y: number;
  };
};

export type MediaSettings = Partial<Record<VariantConfigTypes, Partial<Omit<VariantConfig, "type">>>>;

export interface Credentials {
  shopname: string;
  accesstoken: string;
  shoptype: "SHOPIFY" | "GENERAL";
}

export interface VideoFileUploadArgs {
  mediaid: string;
  fileid: string;
  type: FileType;
}

export interface VideoFileEditArgs {
  mediaid: string;
  fileid: string;
  variant: VariantConfigTypes;
  config: Partial<VariantConfig>;
  credentials?: Credentials;
  type: FileType;
  shoptype: "SHOPIFY" | "GENERAL";
}

export interface GenerateSubtitleArgs {
  mediaid: string;
  fileid: string;
  variantType: VariantConfigTypes;
  config: Partial<VariantConfig>;
  type: FileType;
}
export interface VideoFileExportArgs {
  mediaid: string;
  fileid: string;
  type: FileType;
  credentials?: Credentials;
  newfile?: boolean;
  attempt?: number;
}

export interface ImageFileExportArgs extends VideoFileExportArgs {}

export interface MediaFileMetadata {
  width: number;
  height: number;
  size: number;
}
export interface MediaFile {
  id: string;
  mediaid: string;
  variant: VariantConfigTypes;
  status: MediaFileStatusTypes;
  type: FileType;
  metadata: any;
}

export interface GetVideoUploadUrlArgs {
  key: string;
  contentType: string;
}

export interface StartVideoProcessArgs {
  mediaid?: string;
  sourceurl?: string;
  variants: VariantConfigTypes[];
  credentials?: Credentials;
  settings?: MediaSettings;
  attempt?: number;
  processVariants?: Array<{ fileid: string; variantType: VariantConfigTypes }>;
}

export interface StartImageProcessArgs {
  mediaid?: string;
  sourceurl?: string;
  credentials?: Credentials;
}

export interface IRelativeScore {
  originalFile: string;
  compareFile: string;
  scale?: { width?: number; height?: number };
  threads?: number;
  subsample?: number;
  model?: string;
  device?: string;
}

export enum EventTypes {
  Processing = "PROCESSING",
  ScoreIteration = "SCORE_ITERATION",
  SizeIteration = "SIZE_ITERATION",
  OptimalProcess = "OPTIMAL_PROCESS",
  OptimalSize = "OPTIMAL_SIZE",
  Success = "SUCCESS",
  MetaUpdate = "META_UPDATE",
  Uploaded = "UPLOADED",
  Failed = "FAILED",
  Retry = "RETRY",
}
