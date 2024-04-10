import { IVideo, LamarInput, VideoOperation } from "../types";
import { LamarUtils } from "../util";
export class Video {
  private _operations: VideoOperation[] = [];

  private _source: IVideo & LamarInput;
  constructor(payload: IVideo & LamarInput) {
    this._source = payload;
  }

  // blur(params: { radius: number }) {
  //   this._operations.push({
  //     type: "blur",
  //     params: params,
  //     out: [LamarUtils.generateRandomId(4)],
  //     in: [this.getInputIdentifier()],
  //   });
  //   return this;
  // }
  // sharp(params: { sharpness: number }) {
  //   this._operations.push({
  //     type: "sharp",
  //     params,
  //     out: [LamarUtils.generateRandomId(4)],
  //     in: [this.getInputIdentifier()],
  //   });
  //   return this;
  // }

  private getInputIdentifier() {
    // check if sequence is defined

    // else check if video has operations, if yes then output of previous operation is input of current operation
    if (this._operations.length) {
      return this._operations[this._operations.length - 1].out[0];
    }
    if (this._source.sequence !== undefined) {
      return this._source.uid;
    }
    // else return video id
    return this._source.uid;
  }
  trim(params: { start: number; end: number }) {
    this._operations.push({
      type: "trim",
      params,
      out: [LamarUtils.generateRandomId(4)],
      in: [this.getInputIdentifier()],
      filterId: LamarUtils.generateRandomId(4),
    });
    return this;
  }

  scale(params: { width: number | string; height: number | string; contain?: boolean }) {
    this._operations.push({
      type: "scale",
      params,
      out: [LamarUtils.generateRandomId(4)],
      in: [this.getInputIdentifier()],
      filterId: LamarUtils.generateRandomId(4),
    });
    return this;
  }
  copy() {
    this._operations.push({
      type: "copy",
      out: [LamarUtils.generateRandomId(4)],
      in: [this.getInputIdentifier()],
      filterId: LamarUtils.generateRandomId(4),
      params: {},
    });
    return this;
  }

  crop(params: { width: number; height: number; x: number; y: number }) {
    this._operations.push({
      type: "crop",
      params,
      out: [LamarUtils.generateRandomId(4)],
      in: [this.getInputIdentifier()],
      filterId: LamarUtils.generateRandomId(4),
    });
    return this;
  }
  padding(params: { width: number; height: number; x: number; y: number }) {
    this._operations.push({
      type: "pad",
      params,
      out: [LamarUtils.generateRandomId(4)],
      in: [this.getInputIdentifier()],
      filterId: LamarUtils.generateRandomId(4),
    });
    return this;
  }

  _getSource() {
    return this._source;
  }

  _getOperations() {
    return this._operations;
  }
  _getOutputIdentifier(): string {
    if (!this._operations.length) return this._source.uid;
    return this._operations[this._operations.length - 1].out[0];
  }
}

export type VideoClassType = Video;
