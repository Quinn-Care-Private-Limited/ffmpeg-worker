import { IVideo, VideoOperation } from "../types";
export class Video {
  private id: string;
  private outputId: string;
  constructor(payload: IVideo) {
    this.id = payload.id;
    this.outputId = this.generateRandomId();
  }
  private operations: VideoOperation[] = [];
  private generateRandomId() {
    // generate 9 character random alphanumeric id
    return Math.random().toString(36).substr(2, 9);
  }
  blur(param: { radius: number }) {
    this.operations.push({ type: "blur", radius: param.radius });
    return this;
  }
  sharp(param: { sharpness: number }) {
    this.operations.push({ type: "sharp", sigma: param.sharpness });
    return this;
  }
  trim(param: { start: number; end: number }) {
    this.operations.push({ type: "trim", start: param.start, end: param.end });
    return this;
  }

  scale(param: { width: number; height: number }) {
    this.operations.push({
      type: "scale",
      width: param.width,
      height: param.height,
    });
    return this;
  }
  getId() {
    return this.id;
  }
  getOutputId() {
    return this.outputId;
  }
  getOperations() {
    return this.operations;
  }
}

export type VideoClassType = Video;
