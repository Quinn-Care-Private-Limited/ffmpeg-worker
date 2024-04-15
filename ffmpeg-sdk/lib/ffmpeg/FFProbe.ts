import { AxiosInstance } from "axios";
import { IClientCredentials, ResponseCallback } from "../types";
import { getAxiosInstance, request } from "../request";

export class FFProbe {
  private axios: AxiosInstance;
  private chainCmds: string[] = [];
  private inputFile: string = "";

  constructor(private credentials: IClientCredentials, private responseCallback?: ResponseCallback) {
    this.axios = getAxiosInstance(credentials, responseCallback);
  }

  verbose(verbose?: string) {
    if (!verbose) return this;
    this.chainCmds.push(`-v ${verbose}`);
    return this;
  }

  stream(stream: number) {
    this.chainCmds.push(`-select_streams v:${stream}`);
    return this;
  }

  showstreams(stream: string) {
    this.chainCmds.push(`-show_streams -select_streams ${stream}`);
    return this;
  }

  info() {
    this.chainCmds.push(
      `-show_entries stream=duration,width,height,bit_rate,r_frame_rate -of default=noprint_wrappers=1`,
    );
    return this;
  }

  size() {
    this.chainCmds.push(`-show_entries format=size -of default=noprint_wrappers=1`);
    return this;
  }

  input(path: string) {
    this.inputFile = path;
    return this;
  }

  run() {
    return request<{ data: string }>(this.axios, "/ffmpeg/probe", {
      chainCmds: this.chainCmds,
      input: this.inputFile,
    });
  }
}
