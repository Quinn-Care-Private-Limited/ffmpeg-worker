import { IVideo, VideoOperation } from "../types";
export class Video {
  private _id: string;
  private _outputId: string;
  private _operations: VideoOperation[] = [];

  constructor(payload: IVideo) {
    this._id = payload.id;
    this._outputId = this.generateRandomId();
  }
  private generateRandomId() {
    // generate 9 character random alphanumeric id
    return Math.random().toString(36).substr(2, 9);
  }
  blur(param: { radius: number }) {
    this._operations.push({ type: "blur", radius: param.radius });
    return this;
  }
  sharp(param: { sharpness: number }) {
    this._operations.push({ type: "sharp", sigma: param.sharpness });
    return this;
  }
  trim(param: { start: number; end: number }) {
    this._operations.push({ type: "trim", start: param.start, end: param.end });
    return this;
  }

  scale(param: { width: number; height: number }) {
    this._operations.push({
      type: "scale",
      width: param.width,
      height: param.height,
    });
    return this;
  }
  _getId() {
    return this._id;
  }
  _getOutputId() {
    return this._outputId;
  }
  _getOperations() {
    return this._operations;
  }
}

export type VideoClassType = Video;
