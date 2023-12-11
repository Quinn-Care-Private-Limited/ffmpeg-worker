import { AxiosInstance } from "axios";
import { getAxiosInstance, request } from "../request";
import { IClientCredentials, ICloudStorageCredentials } from "../types";

export class Storage {
  private axios: AxiosInstance;

  constructor(credentials: IClientCredentials, private cloudCredentials?: ICloudStorageCredentials) {
    this.axios = getAxiosInstance(credentials);
  }

  async upload(config: { bucket: string; key: string; path: string; contentType: string; multipart?: boolean }) {
    return request<{ bucket: string; key: string; path: string }>(this.axios, "/storage/upload", {
      ...config,
      credentials: this.cloudCredentials,
    });
  }

  async download(config: { bucket: string; key: string; path: string; multipart?: boolean }) {
    return request<{ bucket: string; key: string; path: string }>(this.axios, "/storage/download", {
      ...config,
      credentials: this.cloudCredentials,
    });
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
    return request<{ callbackId: string }>(this.axios, "/storage/upload", {
      ...config,
      credentials: this.cloudCredentials,
    });
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
    return request<{ callbackId: string }>(this.axios, "/storage/download", {
      ...config,
      credentials: this.cloudCredentials,
    });
  }
}
