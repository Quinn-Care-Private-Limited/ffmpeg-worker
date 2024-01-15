import { IClientCredentials, IRelativeScore, ISourceData } from "../types";
import { FFProcess } from "./FFProcess";
import { FFProbe } from "./FFProbe";
import { Files } from "../files/Files";
import { FFVmaf } from "./FFVmaf";

export class Ffmpeg {
  constructor(private credentials: IClientCredentials) {}

  process() {
    return new FFProcess(this.credentials);
  }

  probe() {
    return new FFProbe(this.credentials);
  }

  vmaf() {
    return new FFVmaf(this.credentials);
  }

  async getFileInfo(inputfile: string) {
    const files = new Files(this.credentials);
    const { data, responseTime } = await files.info(inputfile);

    const sourceData: any = {};
    for (const key in data) {
      const value = data[key];
      if (key === "bit_rate") {
        sourceData.avgbitrate = Math.floor(+value / 1000);
      } else if (key === "r_frame_rate") {
        const [num, den] = value.split("/");
        sourceData.framerate = Math.round(+num / +den);
      } else if (key === "size") {
        sourceData.size = Math.floor(+value / 1000);
      } else {
        sourceData[key] = +value;
      }
    }

    return {
      info: sourceData as ISourceData,
      responseTime,
    };
  }

  async getRelativeScore(payload: IRelativeScore) {
    const { originalFile, compareFile, scale, threads, subsample, model = "vmaf_v0.6.1", device = "desktop" } = payload;

    let scale_filter = "";

    if (scale) {
      scale_filter = `scale=${scale.width || -2}:${scale.height || -2}`;
    } else {
      const {
        info: { width, height },
      } = await this.getFileInfo(originalFile);
      scale_filter = `scale=${width}:${height}`;
    }

    return this.vmaf().run({
      input1: compareFile,
      input2: originalFile,
      scale: scale_filter,
      model,
      threads,
      subsample,
    });
  }

  async getScenes(inputFile: string, threshold = 0.4) {
    const { data, responseTime } = await this.process()
      .input(inputFile)
      .cmd(
        `-filter:v "select='gt(scene,${threshold})',showinfo" -f null - 2>&1 | grep showinfo | awk -F 'pts_time:' '{print $2}' | awk '{print $1}'`,
      )
      .run();

    const pts = data
      .split("\n")
      .filter((item: string) => !!item)
      .map((item: string) => +item);

    return { pts, responseTime };
  }

  async copy(inputFile: string, outputFile: string) {
    return this.process().input(inputFile).codec("copy").output(outputFile).run();
  }

  async concat(inputFiles: string[], outputFile: string) {
    const files = new Files(this.credentials);

    const { path, responseTime: time1 } = await files.path();
    const concatFileContent = inputFiles.map((item) => `file '${path}/${item}'`).join("\n");
    const concatFilePath = outputFile.replace(".mp4", ".txt");
    const { responseTime: time2 } = await files.create(concatFilePath, concatFileContent);

    const { responseTime: time3 } = await this.process()
      .format("concat")
      .flag("safe", "0")
      .input(concatFilePath)
      .codec("copy")
      .output(outputFile)
      .run();

    return { responseTime: time1 + time2 + time3 };
  }

  async segment(inputFile: string, outputDir: string, chunkPrefix: string, targetDuration: number) {
    const { responseTime: time1 } = await this.process()
      .input(inputFile)
      .codec("copy")
      .segment(targetDuration)
      .output(`${outputDir}/${chunkPrefix}_%d.mp4`)
      .run();

    const files = new Files(this.credentials);
    const { list, responseTime: time2 } = await files.list(outputDir);
    const segments = list
      .filter((item) => item.includes(`${chunkPrefix}_`))
      .map((item) => {
        const chunknumber = +item.split("_")[1].split(".")[0];
        const chunkPath = `${outputDir}/${item}`;
        return {
          chunknumber,
          chunkPath,
        };
      })
      .sort((a, b) => a.chunknumber - b.chunknumber);

    return { segments, responseTime: time1 + time2 };
  }

  async twoPassEncode(
    inputFile: string,
    outputFile: string,
    resolution: number,
    videoBitrate: string,
    audioBitrate = "128k",
  ) {
    const logPath = outputFile.replace(".mp4", "");

    const { responseTime: time1 } = await this.process()
      .input(inputFile)
      .videoCodec("libx264")
      .videoBitrate(videoBitrate)
      .resolution(resolution)
      .preset("slow")
      .pass(1, logPath)
      .muted(true)
      .format("mp4")
      .output(outputFile)
      .run();

    const { responseTime: time2 } = await this.process()
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

    return { responseTime: time1 + time2 };
  }
}
