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
  callbackMeta?: Record<string, any>;
  type: WebhookType;
  success: boolean;
  data: any;
}

export interface IAWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

export interface IGCPCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain: string;
}

export type ICloudStorageCredentials = IAWSCredentials | IGCPCredentials;
