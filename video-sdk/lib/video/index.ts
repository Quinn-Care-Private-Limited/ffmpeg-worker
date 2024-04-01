import { IVideo, LamarInput, VideoOperation } from "../types";
export class Video {
  private _operations: VideoOperation[] = [];

  private _source: IVideo & LamarInput;
  constructor(payload: IVideo & LamarInput) {
    this._source = payload;
  }
  private generateRandomId() {
    // generate 9 character random alphanumeric id
    return Math.random().toString(36).substr(2, 4);
  }

  blur(params: { radius: number }) {
    this._operations.push({
      type: "blur",
      params: params,
      out: [this.generateRandomId()],
      in: [this.getInputIdentifier()],
    });
    return this;
  }
  sharp(params: { sharpness: number }) {
    this._operations.push({
      type: "sharp",
      params,
      out: [this.generateRandomId()],
      in: [this.getInputIdentifier()],
    });
    return this;
  }

  private getInputIdentifier() {
    // check if sequence is defined
    if (this._source.sequence !== undefined) {
      return `v${this._source.sequence}`;
    }
    // else check if video has operations, if yes then output of previous operation is input of current operation
    if (this._operations.length) {
      return this._operations[this._operations.length - 1].out[0];
    }
    // else return video id
    return this._source.id;
  }
  trim(params: { start: number; end: number }) {
    this._operations.push({
      type: "trim",
      params,
      out: [this.generateRandomId()],
      in: [this.getInputIdentifier()],
    });
    return this;
  }

  scale(params: { width: number; height: number }) {
    this._operations.push({
      type: "scale",
      params,
      out: [this.generateRandomId()],
      in: [this.getInputIdentifier()],
    });
    return this;
  }
  copy() {
    this._operations.push({
      type: "copy",
      out: [this.generateRandomId()],
      in: [this.getInputIdentifier()],
      params: {},
    });
    return this;
  }
  _getSource() {
    return this._source;
  }

  _getOperations() {
    return this._operations;
  }
}

export type VideoClassType = Video;
