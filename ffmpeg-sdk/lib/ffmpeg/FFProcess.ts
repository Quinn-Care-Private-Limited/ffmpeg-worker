import { IClientCredentials, IFfProcess, ResponseCallback } from "../types";
import { AxiosInstance } from "axios";
import { getAxiosInstance, request, requestWithResponseAbort } from "../request";

export class FFProcess {
  private axios: AxiosInstance;
  private process: IFfProcess = {
    chainCmds: [],
    videoFilterCmds: [],
    audioFilterCmds: [],
    filterGraphs: [],
    output: "",
  };

  private vstream_in?: string | string[];
  private vstream_out?: string | string[];

  private astream_in?: string | string[];
  private astream_out?: string | string[];

  private last_vstream_in?: string | string[];
  private last_astream_in?: string | string[];

  constructor(private credentials: IClientCredentials, private responseCallback?: ResponseCallback) {
    this.axios = getAxiosInstance(credentials, responseCallback);
  }

  init(process: IFfProcess | FFProcess) {
    let processCopy: IFfProcess;
    if (process instanceof FFProcess) processCopy = process.process;
    else processCopy = process;

    this.process.chainCmds.push(...processCopy.chainCmds);
    this.process.videoFilterCmds.push(...processCopy.videoFilterCmds);
    this.process.audioFilterCmds.push(...processCopy.audioFilterCmds);
    this.process.filterGraphs.push(...processCopy.filterGraphs);
    if (processCopy.output) this.process.output = processCopy.output;

    return this;
  }

  get() {
    return this.process;
  }

  log() {
    console.log(this.process);
    return this;
  }

  input(path: string | string[]) {
    if (Array.isArray(path)) {
      path.forEach((p) => this.process.chainCmds.push(`-i ${p}`));
    } else {
      this.process.chainCmds.push(`-i ${path}`);
    }
    return this;
  }

  output(path: string) {
    this.process.output = path;
    return this;
  }

  cmd(cmd?: string) {
    if (!cmd) return this;
    this.process.chainCmds.push(cmd);
    return this;
  }

  codec(encoder?: string) {
    if (!encoder) return this;
    this.process.chainCmds.push(`-c ${encoder}`);
    return this;
  }

  videoCodec(encoder?: string) {
    if (!encoder) return this;
    this.process.chainCmds.push(`-c:v ${encoder}`);
    return this;
  }

  audioCodec(encoder?: string) {
    if (!encoder) return this;
    this.process.chainCmds.push(`-c:a ${encoder}`);
    return this;
  }

  fpsMode(mode?: string) {
    if (!mode) return this;
    this.process.chainCmds.push(`-fps_mode ${mode}`);
    return this;
  }

  crf(crf?: number) {
    if (!crf && crf != 0) return this;
    this.process.chainCmds.push(`-crf ${crf}`);
    return this;
  }

  seekStart(seekStart?: number | string) {
    if (!seekStart) return this;
    this.process.chainCmds.push(`-ss ${seekStart}`);
    return this;
  }

  seekEnd(seekEnd?: number | string) {
    if (!seekEnd) return this;
    this.process.chainCmds.push(`-to ${seekEnd}`);
    return this;
  }

  seekDuration(seekDuration?: number) {
    if (!seekDuration) return this;
    this.process.chainCmds.push(`-t ${seekDuration}`);
    return this;
  }

  screenShot(timestamp?: number | string) {
    if (!timestamp) return this;
    this.process.chainCmds.push(`-ss ${timestamp} -frames:v 1`);
    return this;
  }

  quality(quality?: number) {
    if (!quality) return this;
    this.process.chainCmds.push(`-qscale:v ${quality}`);
    return this;
  }

  segment(segmentTime?: number) {
    if (!segmentTime) return this;
    this.process.chainCmds.push(`-f segment -segment_time ${segmentTime} -reset_timestamps 1`);
    return this;
  }

  movflags(movflags?: string) {
    if (!movflags) return this;
    this.process.chainCmds.push(`-movflags ${movflags}`);
    return this;
  }

  videoBitrate(bitrate?: string) {
    if (!bitrate) return this;
    this.process.chainCmds.push(`-b:v ${bitrate}`);
    return this;
  }

  preset(preset?: string) {
    if (!preset) return this;
    this.process.chainCmds.push(`-preset ${preset}`);
    return this;
  }

  audioBitrate(bitrate?: string) {
    if (!bitrate) return this;
    this.process.chainCmds.push(`-b:a ${bitrate}`);
    return this;
  }

  frameRate(frameRate?: string) {
    if (!frameRate) return this;
    this.process.chainCmds.push(`-r ${frameRate}`);
    return this;
  }

  minVideoBitrate(bitrate?: string) {
    if (!bitrate) return this;
    this.process.chainCmds.push(`-minrate:v ${bitrate}`);
    return this;
  }

  maxVideoBitrate(bitrate?: string) {
    if (!bitrate) return this;
    this.process.chainCmds.push(`-maxrate:v ${bitrate}`);
    return this;
  }

  videoBufsize(bitrate?: string) {
    if (!bitrate) return this;
    this.process.chainCmds.push(`-bufsize:v ${bitrate}`);
    return this;
  }

  pass(pass?: number, logFile?: string) {
    if (!pass) return this;
    this.process.chainCmds.push(`-pass ${pass}`);
    if (logFile) {
      this.process.chainCmds.push(`-passlogfile ${logFile}`);
    }
    return this;
  }

  format(format?: string) {
    if (!format) return this;
    this.process.chainCmds.push(`-f ${format}`);
    return this;
  }

  muted(val?: boolean) {
    if (!val) return this;
    this.process.chainCmds.push(`-an`);
    return this;
  }

  flag(key: string, value?: string) {
    if (value) {
      this.process.chainCmds.push(`-${key} ${value}`);
    } else {
      this.process.chainCmds.push(`-${key}`);
    }
    return this;
  }

  map(stream?: string) {
    if (!stream) return this;
    this.process.chainCmds.push(`-map ${stream}`);
    return this;
  }

  //video filter cmds
  copy() {
    this.process.videoFilterCmds.push(`copy`);
    return this;
  }

  crop(crop?: { x: number | string; y: number | string; width: number | string; height: number | string }) {
    if (!crop) return this;
    this.process.videoFilterCmds.push(`pad=ceil(iw/2)*2:ceil(ih/2)*2`);
    this.process.videoFilterCmds.push(`crop=${crop.width}:${crop.height}:${crop.x}:${crop.y}`);
    return this;
  }

  cropAspectRatio(aspectRatio?: string) {
    if (!aspectRatio) return this;
    const ar = aspectRatio.replace(":", "/");
    this.process.videoFilterCmds.push(`pad='ceil(iw/2)*2:ceil(ih/2)*2'`);
    const width = `'min(if(gte(dar,${ar}),if(gte(iw,ih),ih*${ar},ih/(${ar})),iw),iw)'`;
    const height = `'min(if(gte(dar,${ar}),ih,if(gte(ih,iw),iw/(${ar}),iw*${ar})),ih)'`;
    this.process.videoFilterCmds.push(`crop=${width}:${height}`);
    return this;
  }

  setSar(aspectRatio?: string) {
    if (!aspectRatio) return this;
    this.process.videoFilterCmds.push(`setsar=sar=${aspectRatio}`);
    return this;
  }

  setDar(aspectRatio?: string) {
    if (!aspectRatio) return this;
    this.process.videoFilterCmds.push(`setdar=dar=${aspectRatio}`);
    return this;
  }

  scale(resolution?: { width?: number | string; height?: number | string }, noUpscale?: boolean) {
    if (!resolution) return this;
    if (!resolution.width && !resolution.height) return this;
    const width = resolution.width
      ? typeof resolution.width === "number"
        ? Math.floor(resolution.width / 2) * 2
        : resolution.width
      : -2;
    const height = resolution.height
      ? typeof resolution.height === "number"
        ? Math.floor(resolution.height / 2) * 2
        : resolution.height
      : -2;
    if (noUpscale) {
      this.process.videoFilterCmds.push(`scale='min(${width},iw)':'min(${height},ih)'`);
    } else {
      this.process.videoFilterCmds.push(`scale=${width}:${height}`);
    }
    return this;
  }

  vcopy() {
    this.process.videoFilterCmds.push(`copy`);
    return this;
  }

  resolution(resolution?: number) {
    if (!resolution) return this;
    const width = `'if(gt(iw,ih),-2,${resolution})'`;
    const height = `'if(gt(iw,ih),${resolution},-2)'`;
    this.process.videoFilterCmds.push(`scale=${width}:${height}`);
    return this;
  }

  boxblur(radius?: number) {
    if (!radius) return this;
    this.process.videoFilterCmds.push(`boxblur=${radius}`);
    return this;
  }

  unsharp(effect?: string) {
    if (!effect) return this;
    this.process.videoFilterCmds.push(`unsharp=${effect}`);
    return this;
  }

  trim(start?: number, end?: number) {
    if (!start && !end) return this;
    this.process.videoFilterCmds.push(`trim=${start}:${end}`);
    this.process.videoFilterCmds.push(`setpts=PTS-STARTPTS`);
    return this;
  }

  vstack(count: number) {
    this.process.videoFilterCmds.push(`vstack=${count}`);
    return this;
  }

  hstack(count: number) {
    this.process.videoFilterCmds.push(`hstack=${count}`);
    return this;
  }

  concat(count: number) {
    this.process.videoFilterCmds.push(`concat=n=${count}:v=1:a=0`);
    return this;
  }

  //audio filter cmds
  acopy() {
    this.process.audioFilterCmds.push(`copy`);
    return this;
  }

  atrim(start?: number, end?: number) {
    if (!start && !end) return this;
    this.process.audioFilterCmds.push(`atrim=${start}:${end}`);
    return this;
  }

  amerge(count?: number) {
    this.process.audioFilterCmds.push(`amerge=inputs=${count}`);
    return this;
  }

  aconcat(count: number) {
    this.process.audioFilterCmds.push(`concat=n=${count}:v=0:a=1`);
    return this;
  }

  filter() {
    this.process.chainCmds.push(
      `-vf "${this.process.videoFilterCmds.join(",")},${this.process.audioFilterCmds.join(",")}"`,
    );
    this.process.videoFilterCmds = [];
    this.process.audioFilterCmds = [];
    return this;
  }

  // filterGraphs
  streamIndex(index: number) {
    this.streamIn(`${index}:v`, `${index}:a`);
    this.streamOut(`v${index}`, `a${index}`);
    return this;
  }

  muxStreams(count: number) {
    const vstream = [];
    const astream = [];
    for (let i = 0; i < count; i++) {
      vstream.push(`v${i}`);
      astream.push(`a${i}`);
    }
    this.streamIn(vstream, astream);
    this.streamOut("vout", "aout");
    return this;
  }

  streamIn(vstream: string | string[] | null, astream?: string | string[] | null) {
    if (vstream) this.vstream_in = vstream;
    if (astream) this.astream_in = astream;
    return this;
  }

  streamOut(vstream: string | string[] | null, astream?: string | string[] | null) {
    if (vstream) this.vstream_out = vstream;
    if (astream) this.astream_out = astream;
    return this;
  }

  muxFilterGraph(filter: string, stream_in: string | string[], stream_out: string | string[]) {
    const inputStreams = Array.isArray(stream_in)
      ? stream_in.map((stream) => `[${stream}]`).join("")
      : `[${stream_in}]`;
    const outputStreams = Array.isArray(stream_out)
      ? stream_out.map((stream) => `[${stream}]`).join("")
      : `[${stream_out}]`;

    this.process.filterGraphs.push(`${inputStreams}${filter}${outputStreams}`);
    return this;
  }

  filterGraph(ffmpeg: FFProcess) {
    const input = ffmpeg.process.chainCmds.find((cmd) => cmd.startsWith("-i"));
    if (input) {
      this.input(input.split(" ")[1]);
      ffmpeg.process.chainCmds = ffmpeg.process.chainCmds.filter((cmd) => !cmd.startsWith("-i"));
    }

    if (ffmpeg.process.videoFilterCmds.length && ffmpeg.vstream_in && ffmpeg.vstream_out) {
      if (ffmpeg.vstream_in === "?" && this.last_vstream_in) ffmpeg.vstream_in = this.last_vstream_in;
      this.muxFilterGraph(`${ffmpeg.process.videoFilterCmds.join(",")}`, ffmpeg.vstream_in, ffmpeg.vstream_out);
      this.last_vstream_in = ffmpeg.vstream_out;
    }
    if (ffmpeg.process.audioFilterCmds.length && ffmpeg.astream_in && ffmpeg.astream_out) {
      if (ffmpeg.astream_in === "?" && this.last_astream_in) ffmpeg.astream_in = this.last_astream_in;
      this.muxFilterGraph(`${ffmpeg.process.audioFilterCmds.join(",")}`, ffmpeg.astream_in, ffmpeg.astream_out);
      this.last_astream_in = ffmpeg.astream_out;
    }
    return this;
  }

  mux() {
    this.process.chainCmds.push(`-filter_complex "${this.process.filterGraphs.join(";")}"`);
    this.process.filterGraphs = [];
    if (this.last_vstream_in) this.process.chainCmds.push(`-map "[${this.last_vstream_in}]"`);
    if (this.last_astream_in) this.process.chainCmds.push(`-map "[${this.last_astream_in}]"`);
    return this;
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
