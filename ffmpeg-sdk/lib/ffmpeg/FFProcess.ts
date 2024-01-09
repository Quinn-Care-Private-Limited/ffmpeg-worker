import { IClientCredentials } from "../types";
import { AxiosInstance } from "axios";
import { getAxiosInstance, request, requestWithResponseAbort } from "../request";

export class FFProcess {
  private axios: AxiosInstance;
  private outputFile: string = "";
  private chainCmds: string[] = [];
  private filterCmds: string[] = [];
  private cmdString?: string;

  constructor(private credentials: IClientCredentials) {
    this.axios = getAxiosInstance(credentials);
  }

  input(path: string) {
    this.chainCmds.push(`-i ${path}`);
    return this;
  }

  output(path: string) {
    this.outputFile = path;
    return this;
  }

  codec(encoder?: string) {
    if (!encoder) return this;
    this.chainCmds.push(`-c ${encoder}`);
    return this;
  }

  videoCodec(encoder?: string) {
    if (!encoder) return this;
    this.chainCmds.push(`-c:v ${encoder}`);
    return this;
  }

  audioCodec(encoder?: string) {
    if (!encoder) return this;
    this.chainCmds.push(`-c:a ${encoder}`);
    return this;
  }

  crf(crf?: number) {
    if (!crf && crf != 0) return this;
    this.chainCmds.push(`-crf ${crf}`);
    return this;
  }

  crop(crop?: { x: number; y: number; width: number; height: number }) {
    if (!crop) return this;
    this.filterCmds.push(`pad=ceil(iw/2)*2:ceil(ih/2)*2`);
    this.filterCmds.push(`crop=${crop.width}:${crop.height}:${crop.x}:${crop.y}`);
    return this;
  }

  cropAspectRatio(aspectRatio?: string) {
    if (!aspectRatio) return this;
    const ar = aspectRatio.replace(":", "/");
    this.filterCmds.push(`pad='ceil(iw/2)*2:ceil(ih/2)*2'`);
    const width = `'min(if(gte(dar,${ar}),if(gte(iw,ih),ih*${ar},ih/(${ar})),iw),iw)'`;
    const height = `'min(if(gte(dar,${ar}),ih,if(gte(ih,iw),iw/(${ar}),iw*${ar})),ih)'`;
    this.filterCmds.push(`crop=${width}:${height}`);
    return this;
  }

  setSar(aspectRatio?: string) {
    if (!aspectRatio) return this;
    this.filterCmds.push(`setsar=sar=${aspectRatio}`);
    return this;
  }

  setDar(aspectRatio?: string) {
    if (!aspectRatio) return this;
    this.filterCmds.push(`setdar=dar=${aspectRatio}`);
    return this;
  }

  scale(resolution?: { width?: number; height?: number }, noUpscale?: boolean) {
    if (!resolution) return this;
    if (!resolution.width && !resolution.height) return this;
    const width = resolution.width ? Math.floor(resolution.width / 2) * 2 : -2;
    const height = resolution.height ? Math.floor(resolution.height / 2) * 2 : -2;
    if (noUpscale) {
      this.filterCmds.push(`scale='min(${width},iw)':'min(${height},ih)'`);
    } else {
      this.filterCmds.push(`scale=${width}:${height}`);
    }
    return this;
  }

  resolution(resolution?: number) {
    if (!resolution) return this;
    const width = `'if(gt(iw,ih),-2,${resolution})'`;
    const height = `'if(gt(iw,ih),${resolution},-2)'`;

    this.filterCmds.push(`scale=${width}:${height}`);
    return this;
  }

  seekStart(seekStart?: number | string) {
    if (!seekStart) return this;
    this.chainCmds.push(`-ss ${seekStart}`);
    return this;
  }

  seekEnd(seekEnd?: number | string) {
    if (!seekEnd) return this;
    this.chainCmds.push(`-to ${seekEnd}`);
    return this;
  }

  seekDuration(seekDuration?: number | string) {
    if (!seekDuration) return this;
    this.chainCmds.push(`-t ${seekDuration}`);
    return this;
  }

  screenShot(timestamp?: number | string) {
    if (!timestamp) return this;
    this.chainCmds.push(`-ss ${timestamp} -frames:v 1`);
    return this;
  }

  quality(quality?: number) {
    if (!quality) return this;
    this.chainCmds.push(`-qscale:v ${quality}`);
    return this;
  }

  segment(segmentTime?: number) {
    if (!segmentTime) return this;
    this.chainCmds.push(`-f segment -segment_time ${segmentTime} -reset_timestamps 1 -map 0`);
    return this;
  }

  movflags(movflags?: string) {
    if (!movflags) return this;
    this.chainCmds.push(`-movflags ${movflags}`);
    return this;
  }

  videoBitrate(bitrate?: string) {
    if (!bitrate) return this;
    this.chainCmds.push(`-b:v ${bitrate}`);
    return this;
  }

  preset(preset?: string) {
    if (!preset) return this;
    this.chainCmds.push(`-preset ${preset}`);
    return this;
  }

  audioBitrate(bitrate?: string) {
    if (!bitrate) return this;
    this.chainCmds.push(`-b:a ${bitrate}`);
    return this;
  }

  frameRate(frameRate?: string) {
    if (!frameRate) return this;
    this.chainCmds.push(`-r ${frameRate}`);
    return this;
  }

  minVideoBitrate(bitrate?: string) {
    if (!bitrate) return this;
    this.chainCmds.push(`-minrate:v ${bitrate}`);
    return this;
  }

  maxVideoBitrate(bitrate?: string) {
    if (!bitrate) return this;
    this.chainCmds.push(`-maxrate:v ${bitrate}`);
    return this;
  }

  videoBufsize(bitrate?: string) {
    if (!bitrate) return this;
    this.chainCmds.push(`-bufsize:v ${bitrate}`);
    return this;
  }

  pass(pass?: number, logFile?: string) {
    if (!pass) return this;
    this.chainCmds.push(`-pass ${pass}`);
    if (logFile) {
      this.chainCmds.push(`-passlogfile ${logFile}`);
    }
    return this;
  }

  format(format?: string) {
    if (!format) return this;
    this.chainCmds.push(`-f ${format}`);
    return this;
  }

  muted(val?: boolean) {
    if (!val) return this;
    this.chainCmds.push(`-an`);
    return this;
  }

  flag(key: string, value?: string) {
    if (value) {
      this.chainCmds.push(`-${key} ${value}`);
    } else {
      this.chainCmds.push(`-${key}`);
    }
    return this;
  }

  cmd(cmd: string) {
    this.cmdString = cmd;
    return this;
  }

  async run() {
    return request<{ data: any }>(this.axios, "/ffmpeg/process", {
      chainCmds: this.chainCmds,
      filterCmds: this.filterCmds,
      cmdString: this.cmdString,
      output: this.outputFile,
    });
  }

  async schedule<T = {}>(config: { callbackId?: string; callbackUrl: string; callbackMeta?: T }) {
    return requestWithResponseAbort(this.axios, "/ffmpeg/process/schedule", {
      chainCmds: this.chainCmds,
      filterCmds: this.filterCmds,
      cmdString: this.cmdString,
      output: this.outputFile,
      ...config,
    });
  }
}
