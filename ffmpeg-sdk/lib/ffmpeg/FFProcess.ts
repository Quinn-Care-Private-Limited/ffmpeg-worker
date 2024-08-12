import { IClientCredentials, ResponseCallback } from "../types";
import { AxiosInstance } from "axios";
import { getAxiosInstance, request, requestWithResponseAbort } from "../request";
import { FFProcessGenerator } from "./FFProcessGenerator";

export class FFProcess extends FFProcessGenerator {
  private axios: AxiosInstance;

  constructor(private credentials: IClientCredentials, private responseCallback?: ResponseCallback) {
    super();
    this.axios = getAxiosInstance(credentials, responseCallback);
  }

  async run() {
    return request<{ data: any }>(this.axios, "/ffmpeg/process", this.process);
  }

  async runProcesses(ffmpegs: FFProcess[]) {
    return request<{ data: any[] }>(this.axios, "/ffmpeg/multi_process", {
      processes: ffmpegs.map((ffmpeg) => ffmpeg.process),
    });
  }

  async schedule<T = {}>(config: { callbackId?: string; callbackUrl: string; callbackMeta?: T }) {
    return requestWithResponseAbort(this.axios, "/ffmpeg/process/schedule", {
      ...this.process,
      ...config,
    });
  }

  async scheduleProcesses<T = {}>(
    ffmpegs: FFProcess[],
    config: {
      callbackId?: string;
      callbackUrl: string;
      callbackMeta?: T;
    },
  ) {
    return requestWithResponseAbort(this.axios, "/ffmpeg/multi_process/schedule", {
      processes: ffmpegs.map((ffmpeg) => ffmpeg.process),
      ...config,
    });
  }
}
