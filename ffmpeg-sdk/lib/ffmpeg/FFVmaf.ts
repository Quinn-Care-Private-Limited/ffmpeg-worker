import { AxiosInstance } from "axios";
import { IClientCredentials } from "../types";
import { getAxiosInstance, request } from "../request";

export class FFVmaf {
  private axios: AxiosInstance;

  constructor(credentials: IClientCredentials) {
    this.axios = getAxiosInstance(credentials);
  }

  async run(config: {
    input1: string;
    input2: string;
    scale: string;
    model: string;
    subsample?: number;
    threads?: number;
  }) {
    return request<{ score: number }>(this.axios, "/ffmpeg/vmaf", config);
  }
}
