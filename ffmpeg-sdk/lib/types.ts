export interface IClientCredentials {
  clientId: string;
  clientSecret: string;
  clientServerUrl: string;
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

export interface ISourceData {
  height: number;
  width: number;
  duration: number;
  avgbitrate: number;
  framerate: number;
  size: number;
}

export enum WebhookType {
  FFMPEG = "FFMPEG",
  STORAGE_UPLOAD = "STORAGE_UPLOAD",
  STORAGE_DOWNLOAD = "STORAGE_DOWNLOAD",
}

export interface IWebhookResponse {
  callbackId: string;
  type: WebhookType;
  success: boolean;
  data: any;
}
