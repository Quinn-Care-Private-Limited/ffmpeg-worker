import { IClientCredentials, IRelativeScore, ISourceData } from "../types";
import { FFProcess } from "./FFProcess";
import { FFProbe } from "./FFProbe";
import { Files } from "../files/Files";
import { FFVmaf } from "./FFVmaf";

export class Ffmpeg {
  private files: Files;

  constructor(private credentials: IClientCredentials) {
    this.files = new Files(this.credentials);
  }

  process() {
    return new FFProcess(this.credentials);
  }

  probe() {
    return new FFProbe(this.credentials);
  }

  vmaf() {
    return new FFVmaf(this.credentials);
  }

  async getFileInfo(inputfile: string): Promise<ISourceData> {
    const fileInfoPromise = this.probe().verbose("error").stream(0).info().input(inputfile).run();
    const fileSizePromise = this.probe().verbose("error").stream(0).size().input(inputfile).run();

    const [fileInfo, sizeData] = await Promise.all([fileInfoPromise, fileSizePromise]);
    const data: any = {};

    const lines = `${fileInfo.data}\n${sizeData.data}`.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const [key, value] = line.split("=");
      if (key && value) {
        if (key === "bit_rate") {
          data.avgbitrate = Math.floor(+value / 1000);
        } else if (key === "r_frame_rate") {
          const [num, den] = value.split("/");
          data.framerate = Math.round(+num / +den);
        } else if (key === "size") {
          data.size = Math.floor(+value / 1000);
        } else {
          data[key] = +value;
        }
      }
    }

    return data as ISourceData;
  }

  async getRelativeScore(payload: IRelativeScore) {
    const { originalFile, compareFile, scale, threads, subsample, model = "vmaf_v0.6.1", device = "desktop" } = payload;

    let scale_filter = "";

    if (scale) {
      scale_filter = `scale=${scale.width || -2}:${scale.height || -2}`;
    } else {
      const { width, height } = await this.getFileInfo(originalFile);
      scale_filter = `scale=${width}:${height}`;
    }

    return this.vmaf().run({
      input1: originalFile,
      input2: compareFile,
      scale: scale_filter,
      model,
      threads,
      subsample,
    });
  }

  async getScenes(inputFile: string, threshold = 0.4) {
    const { data } = await this.process()
      .input(inputFile)
      .cmd(
        `-filter:v "select='gt(scene,${threshold})',showinfo" -f null - 2>&1 | grep showinfo | awk -F 'pts_time:' '{print $2}' | awk '{print $1}'`,
      )
      .run();

    const pts = data
      .split("\n")
      .filter((item: string) => !!item)
      .map((item: string) => +item);

    return pts;
  }

  async copy(inputFile: string, outputFile: string): Promise<void> {
    await this.process().input(inputFile).codec("copy").output(outputFile).run();
  }

  async concat(inputFiles: string[], outputFile: string): Promise<void> {
    const { path } = await this.files.path();
    const concatFileContent = inputFiles.map((item) => `file '${path}/${item}'`).join("\n");
    const concatFilePath = outputFile.replace(".mp4", ".txt");
    await this.files.create(concatFilePath, concatFileContent);

    await this.process()
      .format("concat")
      .flag("safe", "0")
      .input(concatFilePath)
      .codec("copy")
      .output(outputFile)
      .run();
    await this.files.delete(concatFilePath);
  }

  async segment(inputFile: string, outputDir: string, targetDuration: number) {
    await this.process()
      .input(inputFile)
      .codec("copy")
      .segment(targetDuration)
      .output(`${outputDir}/segment_%d.mp4`)
      .run();

    const { list } = await this.files.list(outputDir);
    const segments = list
      .filter((item) => item.includes("segment_"))
      .map((item) => {
        const chunknumber = +item.split("_")[1].split(".")[0];
        const chunkPath = `${outputDir}/${item}`;
        return {
          chunknumber,
          chunkPath,
        };
      })
      .sort((a, b) => a.chunknumber - b.chunknumber);

    return segments;
  }

  async twoPassEncode(
    inputFile: string,
    outputFile: string,
    resolution: number,
    videoBitrate: string,
    audioBitrate = "128k",
  ) {
    const logPath = outputFile.replace(".mp4", "");

    await this.process()
      .input(inputFile)
      .videoCodec("libx264")
      .videoBitrate(videoBitrate)
      .resolution(resolution)
      .preset("slow")
      .pass(1, logPath)
      .noAudio()
      .format("mp4")
      .output(outputFile)
      .run();

    await this.process()
      .input(inputFile)
      .audioCodec("aac")
      .audioBitrate(audioBitrate)
      .videoCodec("libx264")
      .videoBitrate(videoBitrate)
      .resolution(resolution)
      .preset("slow")
      .pass(2, logPath)
      .output(outputFile)
      .run();

    this.files.delete(`${logPath}-0.log`);
    this.files.delete(`${logPath}-0.log.mbtree`);
  }
}
