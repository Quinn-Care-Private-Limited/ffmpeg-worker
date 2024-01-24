import { IVideo, VideoOperation } from "../types";
class Video {
  public assetId: string;
  constructor(payload: IVideo) {
    this.assetId = payload.assetId;
  }
  private operations: VideoOperation[] = [];

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
    return this.assetId;
  }
  getOperations() {
    return this.operations;
  }
  done() {
    return this;
  }
}

export default Video;

export type VideoClassType = Video;
