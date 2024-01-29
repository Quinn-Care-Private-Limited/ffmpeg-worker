import { XelpRequest } from "../request";
import { GroupVideo, SingleVideo, XelpVidoes } from "../types";
import { VideoClassType, Video } from "../video";
type Input = { id: string };
export class Xelp {
  private _videos: XelpVidoes[];
  private _xelpRequest: XelpRequest;
  constructor({ apiKey }: { apiKey: string }) {
    if (!apiKey) {
      throw new Error("API Key is required");
    }
    this._videos = [];
    this._xelpRequest = new XelpRequest({ apiKey });
  }
  input({ id }: { id: string }) {
    const video = new Video({ id, type: "source" });
    this._videos.push({ type: "video", video });
    return video;
  }
  private generateRandomId() {
    // generate 9 character random alphanumeric id
    return Math.random().toString(36).substr(2, 9);
  }
  concat(...videos: Video[]) {
    const id = this.generateRandomId();
    const video = new Video({ id, type: "intermediate" });
    this._videos.push({ type: "group", videos, operationType: "concat", id, referenceVideo: video });
    return video;
  }
  splitscreen(...videos: Video[]) {
    const id = this.generateRandomId();
    const video = new Video({ id, type: "intermediate" });
    this._videos.push({ type: "group", videos, operationType: "splitscreen", id, referenceVideo: video });
    return video;
  }
  async process(): Promise<any> {
    const inputs = this._getInputs();
    const operations = this._getOperations();
    const json = { inputs, operations };
    await this._xelpRequest.post({ data: json });
    return json;
  }
  private _getInputs(): Input[] {
    const singleVideos = this._videos.filter((video) => video.type == "video") as SingleVideo[];
    return singleVideos.map((video) => {
      return { id: video.video._getId() };
    });
  }
  private _getOperations() {
    const inputs = this._getInputs();
    const operations: any = [];
    this._videos.forEach((video) => {
      if (video.type == "video") {
        operations.push(this._getSingleVideoOperation(video.video, inputs));
      } else {
        const outputs = this._getMultieVideoOperation(video, inputs).flat();
        operations.push(...outputs);
      }
    });
    return operations;
  }

  private _getSingleVideoOperation(video: VideoClassType, inputs: Input[]) {
    const operations = video._getOperations();
    const id = video._getId();
    const index = inputs.findIndex((item) => item!.id == id);
    const operationName = operations.length ? operations.map((operation) => operation.type).join("_") : `$${index}`;
    return {
      name: operationName,
      inputs: [id],
      params: operations,
      outputName: video._getOutputId(),
    };
  }
  private _getMultieVideoOperation(video: GroupVideo, inputs: Input[]) {
    const { operationType, id, videos, referenceVideo } = video;
    const i = videos.map((video) => {
      return video._getOutputId();
    });

    const outputs = [
      {
        name: operationType,
        inputs: i,
        params: [],
        outputName: id,
      },
    ];
    if (video.referenceVideo._getOperations().length) {
      const referenceVideoOperations = this._getSingleVideoOperation(video.referenceVideo, inputs);
      return [...outputs, referenceVideoOperations];
    }
    return outputs;
  }
}
