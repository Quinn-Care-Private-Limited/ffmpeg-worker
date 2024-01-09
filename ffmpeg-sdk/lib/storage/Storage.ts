import { AxiosInstance } from "axios";
import { getAxiosInstance, request, requestWithResponseAbort } from "../request";
import { IClientCredentials, ICloudStorageCredentials } from "../types";

export class Storage {
  private axios: AxiosInstance;

  constructor(credentials: IClientCredentials, private cloudCredentials?: ICloudStorageCredentials | null) {
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
    bucket: string;
    key: string;
    path: string;
    contentType: string;
    multipart?: boolean;
    partSize?: number;
    batchSize?: number;
    callbackId?: string;
    callbackUrl: string;
    callbackMeta?: T;
  }) {
    return requestWithResponseAbort(this.axios, "/storage/upload/schedule", {
      ...config,
      credentials: this.cloudCredentials,
    });
  }

  async scheduleDownload<T = {}>(config: {
    bucket: string;
    key: string;
    path: string;
    multipart?: boolean;
    partSize?: number;
    callbackId?: string;
    callbackUrl: string;
    callbackMeta?: T;
  }) {
    return requestWithResponseAbort(this.axios, "/storage/download/schedule", {
      ...config,
      credentials: this.cloudCredentials,
    });
  }
}
