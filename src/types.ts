export enum WebhookType {
  FFMPEG = "FFMPEG",
  STORAGE_UPLOAD = "STORAGE_UPLOAD",
  STORAGE_DOWNLOAD = "STORAGE_DOWNLOAD",
}

export interface IWebhookResponse {
  callbackId: string;
  callbackMeta?: Record<string, any>;
  type: WebhookType;
  success: boolean;
  data: any;
}
