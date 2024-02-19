import { AxiosInstance } from "axios";
import { getAxiosInstance, request, requestWithResponseAbort } from "../request";
import { IClientCredentials, ICloudStorageCredentials, ResponseCallback } from "../types";

export class Storage {
  private axios: AxiosInstance;
  private cloudStorageType: "AWS" | "GCP";

  constructor(
    private credentials: IClientCredentials,
    private cloudCredentials: ICloudStorageCredentials,
    private responseCallback?: ResponseCallback,
  ) {
    this.axios = getAxiosInstance(credentials, responseCallback);
    if ("accessKeyId" in cloudCredentials) {
      this.cloudStorageType = "AWS";
    } else {
      this.cloudStorageType = "GCP";
    }
  }

  async upload(config: {
    bucket: string;
    key: string;
    path: string;
    contentType: string;
    multipart?: boolean;
    ttl?: number;
  }) {
    return request<{ bucket: string; key: string; path: string }>(this.axios, "/storage/upload", {
      ...config,
      cloudStorageType: this.cloudStorageType,
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
    ttl?: number;
  }) {
    return requestWithResponseAbort(this.axios, "/storage/upload/schedule", {
      ...config,
      cloudStorageType: this.cloudStorageType,
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
      cloudStorageType: this.cloudStorageType,
      credentials: this.cloudCredentials,
    });
  }
}
