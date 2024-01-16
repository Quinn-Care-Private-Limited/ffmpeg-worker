import { IClientCredentials, ResponseCallback } from "../types";
import { FFProcess } from "./FFProcess";
import { FFProbe } from "./FFProbe";
import { FFVmaf } from "./FFVmaf";

export class Ffmpeg {
  constructor(private credentials: IClientCredentials, private responseCallback?: ResponseCallback) {}

  process() {
    return new FFProcess(this.credentials, this.responseCallback);
  }

  probe() {
    return new FFProbe(this.credentials, this.responseCallback);
  }

  vmaf() {
    return new FFVmaf(this.credentials, this.responseCallback);
  }
}
