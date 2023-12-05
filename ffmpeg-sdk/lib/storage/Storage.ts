import { AxiosInstance } from "axios";
import { getAxiosInstance, request } from "../request";
import { IClientCredentials } from "../types";

export class Storage {
  private axios: AxiosInstance;

  constructor(private credentials: IClientCredentials) {
    this.axios = getAxiosInstance(credentials);
  }

  async upload(config: { bucket: string; key: string; path: string; contentType: string; multipart?: boolean }) {
    return request<{ bucket: string; key: string; path: string }>(this.axios, "/storage/upload", config);
  }

  async download(config: { bucket: string; key: string; path: string; multipart?: boolean }) {
    return request<{ bucket: string; key: string; path: string }>(this.axios, "/storage/download", config);
  }

  async scheduleUpload<T = {}>(config: {
    callbackId?: string;
    callbackUrl?: string;
    bucket: string;
    key: string;
    path: string;
    contentType: string;
    multipart?: boolean;
    partSize?: number;
    batchSize?: number;
    callbackMeta?: T;
  }) {
    return request<{ callbackId: string }>(this.axios, "/storage/upload", config);
  }

  async scheduleDownload<T = {}>(config: {
    callbackId?: string;
    callbackUrl?: string;
    bucket: string;
    key: string;
    path: string;
    multipart?: boolean;
    partSize?: number;
    callbackMeta?: T;
  }) {
    return request<{ callbackId: string }>(this.axios, "/storage/download", config);
  }
}
