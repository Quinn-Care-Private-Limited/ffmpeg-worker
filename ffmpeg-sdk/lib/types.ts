export interface IClientCredentials {
  clientId: string;
  clientSecret: string;
  clientServerUrl: string;
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
  responsePayload: IResponsePayload;
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

export interface IResponsePayload {
  responseTime: number;
  path: string;
  method: string;
  baseURL: string;
  status: number;
}

export type ResponseCallback = (payload: IResponsePayload) => void;
