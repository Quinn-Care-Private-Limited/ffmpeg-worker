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

  constructor(private credentials: IClientCredentials, private responseCallback?: ResponseCallback) {
    this.axios = getAxiosInstance(credentials, responseCallback);
  }

  init(process: Partial<IFfProcess> | FFProcess) {
    let processCopy: Partial<IFfProcess>;

    if (process instanceof FFProcess) processCopy = process.process;
    else processCopy = process;

    if (processCopy.chainCmds) this.process.chainCmds.push(...processCopy.chainCmds);
    if (processCopy.videoFilterCmds) this.process.videoFilterCmds.push(...processCopy.videoFilterCmds);
    if (processCopy.audioFilterCmds) this.process.audioFilterCmds.push(...processCopy.audioFilterCmds);
    if (processCopy.filterGraphs) this.process.filterGraphs.push(...processCopy.filterGraphs);
    if (processCopy.output) this.process.output = processCopy.output;
    if (processCopy.vstream_in) this.process.vstream_in = processCopy.vstream_in;
    if (processCopy.vstream_out) this.process.vstream_out = processCopy.vstream_out;
    if (processCopy.astream_in) this.process.astream_in = processCopy.astream_in;
    if (processCopy.astream_out) this.process.astream_out = processCopy.astream_out;
    if (processCopy.last_vstream_in) this.process.last_vstream_in = processCopy.last_vstream_in;
    if (processCopy.last_astream_in) this.process.last_astream_in = processCopy.last_astream_in;

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

  subCodec(encoder?: string) {
    if (!encoder) return this;
    this.process.chainCmds.push(`-c:s ${encoder}`);
    return this;
  }

  fpsMode(mode?: string) {
    if (!mode) return this;
    this.process.chainCmds.push(`-fps_mode ${mode}`);
    return this;
  }

  vsync(vsync?: boolean) {
    if (!vsync) return this;
    this.process.chainCmds.push(`-vsync vfr`);
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

  frames(frames?: number) {
    if (!frames) return this;
    this.process.chainCmds.push(`-frames:v ${frames}`);
    return this;
  }

  loop(loop?: number) {
    if (!loop) return this;
    this.process.chainCmds.push(`-loop ${loop}`);
    return this;
  }

  time(time?: number) {
    if (!time) return this;
    this.process.chainCmds.push(`-t ${time}`);
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
  vcopy() {
    this.process.videoFilterCmds.push(`copy`);
    return this;
  }

  crop(crop?: { x: number | string; y: number | string; width: number | string; height: number | string }) {
    if (!crop) return this;
    this.process.videoFilterCmds.push(`pad=ceil(iw/2)*2:ceil(ih/2)*2`);
    this.process.videoFilterCmds.push(
      `crop=min(${crop.width},iw):min(${crop.height},ih):min(${crop.x},iw):min(${crop.y},ih)`,
    );
    return this;
  }

  ass(file?: string) {
    if (!file) return this;
    this.process.videoFilterCmds.push(`ass=${file}`);
    return this;
  }

  cropAr(aspectRatio?: string) {
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

  pad(padding?: { width: number | string; height: number | string; x: number | string; y: number | string }) {
    if (!padding) return this;
    this.process.videoFilterCmds.push(`pad=${padding.width}:${padding.height}:${padding.x}:${padding.y}`);
    return this;
  }

  scale(resolution?: { width?: number | string; height?: number | string; noUpscale?: boolean; contain?: boolean }) {
    if (!resolution) return this;
    if (!resolution.width && !resolution.height) return this;

    if (resolution.contain) {
      const w = resolution.width
        ? typeof resolution.width === "number"
          ? Math.floor(resolution.width / 2) * 2
          : resolution.width
        : "iw";
      const h = resolution.height
        ? typeof resolution.height === "number"
          ? Math.floor(resolution.height / 2) * 2
          : resolution.height
        : "ih";

      this.process.videoFilterCmds.push(`scale='iw*min(${w}/iw,${h}/ih)':'ih*min(${w}/iw,${h}/ih)'`);
      this.process.videoFilterCmds.push(`pad=${w}:${h}:(${w}-iw)/2:(${h}-ih)/2`);
    } else {
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

      if (resolution.noUpscale) {
        this.process.videoFilterCmds.push(`scale='min(${width},iw)':'min(${height},ih)'`);
      } else {
        this.process.videoFilterCmds.push(`scale=${width}:${height}`);
      }
    }

    //give padding if type is contain

    return this;
  }

  resolution(resolution?: number | string) {
    if (!resolution) return this;
    const width = `'if(gt(iw,ih),-2,${resolution})'`;
    const height = `'if(gt(iw,ih),${resolution},-2)'`;
    this.process.videoFilterCmds.push(`scale=${width}:${height}`);
    return this;
  }

  capture(frame?: number) {
    if (!frame) return this;
    this.process.videoFilterCmds.push(`select='gte(n\\,${frame})'`);
    return this;
  }

  blur(radius?: number) {
    if (!radius) return this;
    this.process.videoFilterCmds.push(`boxblur=${radius}`);
    return this;
  }

  opacity(opacity?: number) {
    if (!opacity) return this;
    this.process.videoFilterCmds.push(`format=argb,geq=r='r(X,Y)':a='${opacity}*alpha(X,Y)'`);
    return this;
  }

  sharp(size?: number, amount: number = 1) {
    if (!size) return this;
    this.process.videoFilterCmds.push(`unsharp=${size}:${size}:${amount}`);
    return this;
  }

  trim(start: number, end: number) {
    this.process.videoFilterCmds.push(`trim=${start}:${end}`);
    this.process.videoFilterCmds.push(`setpts=PTS-STARTPTS`);
    return this;
  }

  vstack(count: number, shortest?: boolean) {
    this.process.videoFilterCmds.push(`vstack=${count}:shortest=${shortest ? 1 : 0}`);
    return this;
  }

  hstack(count: number, shortest?: boolean) {
    this.process.videoFilterCmds.push(`hstack=${count}:shortest=${shortest ? 1 : 0}`);
    return this;
  }

  overlay(params?: { x: number | string; y: number | string; start?: number; end?: number; shortest?: boolean }) {
    if (!params) return this;
    let cmd = `overlay=`;
    if (params.start !== undefined && params.end !== undefined) {
      cmd += `enable='between(t,${params.start},${params.end})':`;
    }
    cmd += `x=${params.x}:y=${params.y}`;
    if (params.shortest) cmd += `:shortest=1`;
    this.process.videoFilterCmds.push(cmd);
    return this;
  }

  concat(count: number) {
    this.process.videoFilterCmds.push(`concat=n=${count}:v=1:a=1`);
    return this;
  }

  vconcat(count: number) {
    this.process.videoFilterCmds.push(`concat=n=${count}:v=1:a=0`);
    return this;
  }

  //audio filter cmds
  acopy() {
    this.process.audioFilterCmds.push(`acopy`);
    return this;
  }

  atrim(start: number, end: number, loop?: { count: number; rate?: number }) {
    if (!start && !end) return this;
    this.process.audioFilterCmds.push(`atrim=${start}:${end},asetpts=PTS-STARTPTS`);
    if (loop) {
      this.aloop({ count: loop.count, duration: end - start, rate: loop.rate });
    }
    return this;
  }

  amix(
    count: number,
    mixer?: { weights?: number[]; normalize?: boolean; shortest?: boolean; dropout_transition?: number },
  ) {
    let cmd = `amix=inputs=${count}`;
    if (mixer?.weights) {
      cmd += `:weights='${mixer.weights.join(" ")}'`;
    }
    if (mixer?.normalize !== undefined) {
      cmd += `:normalize=${mixer.normalize ? 1 : 0}`;
    }
    if (mixer?.shortest !== undefined) {
      cmd += `:duration=${mixer.shortest ? "shortest" : "longest"}`;
    }
    if (mixer?.dropout_transition) {
      cmd += `:dropout_transition=${mixer.dropout_transition}`;
    }
    this.process.audioFilterCmds.push(cmd);
    return this;
  }

  aloop(data?: { count: number; duration: number; rate?: number }) {
    if (!data) return this;
    if (!data.count) return this;
    const rate = data.rate || 48000;
    this.process.audioFilterCmds.push(`asetrate=${rate},aloop=loop=${data.count}:size=${data.duration}*${rate}`);
    return this;
  }

  areplace() {
    this.amix(2, { weights: [0, 1], shortest: true });
    return this;
  }

  amerge(count: number) {
    this.process.audioFilterCmds.push(`amerge=inputs=${count}`);
    return this;
  }

  avolume(volume: number | string) {
    this.process.audioFilterCmds.push(`volume=${volume}`);
    return this;
  }

  amute() {
    this.process.audioFilterCmds.push(`volume=0`);
    return this;
  }

  aconcat(count: number) {
    this.process.audioFilterCmds.push(`concat=n=${count}:v=0:a=1`);
    return this;
  }

  filter() {
    if (this.process.videoFilterCmds.length || this.process.audioFilterCmds.length) {
      const filters = [...this.process.videoFilterCmds, ...this.process.audioFilterCmds];
      this.process.chainCmds.push(`-vf "${filters.join(",")}"`);
    }
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
    if (vstream) this.process.vstream_in = vstream;
    if (astream) this.process.astream_in = astream;
    return this;
  }

  streamOut(vstream: string | string[] | null, astream?: string | string[] | null) {
    if (vstream) this.process.vstream_out = vstream;
    if (astream) this.process.astream_out = astream;
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

    if (ffmpeg.process.videoFilterCmds.length && ffmpeg.process.vstream_in && ffmpeg.process.vstream_out) {
      if (ffmpeg.process.vstream_in === "?" && this.process.last_vstream_in) {
        ffmpeg.process.vstream_in = this.process.last_vstream_in;
      }

      this.muxFilterGraph(
        `${ffmpeg.process.videoFilterCmds.join(",")}`,
        ffmpeg.process.vstream_in,
        ffmpeg.process.vstream_out,
      );

      if (ffmpeg.process.vstream_out instanceof Array)
        this.process.last_vstream_in = ffmpeg.process.vstream_out[ffmpeg.process.vstream_out.length - 1];
      else this.process.last_vstream_in = ffmpeg.process.vstream_out;
    }
    if (ffmpeg.process.audioFilterCmds.length && ffmpeg.process.astream_in && ffmpeg.process.astream_out) {
      if (ffmpeg.process.astream_in === "?" && this.process.last_astream_in) {
        ffmpeg.process.astream_in = this.process.last_astream_in;
      }

      this.muxFilterGraph(
        `${ffmpeg.process.audioFilterCmds.join(",")}`,
        ffmpeg.process.astream_in,
        ffmpeg.process.astream_out,
      );
      if (ffmpeg.process.astream_out instanceof Array)
        this.process.last_astream_in = ffmpeg.process.astream_out[ffmpeg.process.astream_out.length - 1];
      else this.process.last_astream_in = ffmpeg.process.astream_out;
    }

    return this;
  }

  mux(vstream?: string | null, astream?: string | null) {
    this.process.chainCmds.push(`-filter_complex "${this.process.filterGraphs.join(";")}"`);
    this.process.filterGraphs = [];
    if (vstream || this.process.last_vstream_in)
      this.process.chainCmds.push(`-map "[${vstream || this.process.last_vstream_in}]"`);
    if (astream || this.process.last_astream_in)
      this.process.chainCmds.push(`-map "[${astream || this.process.last_astream_in}]"`);
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
