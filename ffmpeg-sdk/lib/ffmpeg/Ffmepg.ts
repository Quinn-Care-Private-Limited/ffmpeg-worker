import { IClientCredentials } from "../types";
import { FFProcess } from "./FFProcess";
import { FFProbe } from "./FFProbe";
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
}
