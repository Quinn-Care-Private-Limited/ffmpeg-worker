export enum WebhookType {
  FFMPEG = "FFMPEG",
  STORAGE_UPLOAD = "STORAGE_UPLOAD",
  STORAGE_DOWNLOAD = "STORAGE_DOWNLOAD",
}

export type IAWSCredentials = any;
export type IGCPCredentials = any;

export type ICloudStorageCredentials = IAWSCredentials | IGCPCredentials;

export interface IResponsePayload {
  responseTime: number;
  path: string;
  method: string;
  baseURL: string;
  status: number;
}
export interface IWebhookResponse {
  callbackId: string;
  callbackMeta?: Record<string, any>;
  responsePayload: IResponsePayload;
  type: WebhookType;
  success: boolean;
  data: any;
}
