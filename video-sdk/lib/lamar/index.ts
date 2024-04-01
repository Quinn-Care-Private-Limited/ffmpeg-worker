import { LamarRequest } from "../request";
import { GroupVideo, LamarInput, SingleVideo, XelpVidoes } from "../types";
import { VideoClassType, Video } from "../video";
type Input = { id: string };
export class Lamar {
  private _videos: XelpVidoes[];
  private _xelpRequest: LamarRequest;
  constructor({ apiKey }: { apiKey: string }) {
    if (!apiKey) {
      throw new Error("API Key is required");
    }
    this._videos = [];
    this._xelpRequest = new LamarRequest({ apiKey });
  }
  input(payload: LamarInput) {
    const video = new Video({ ...payload, type: "source", sequence: this._videos.length, id: this.generateRandomId() });
    this._videos.push({ type: "video", video });
    return video;
  }
  private generateRandomId() {
    // generate 9 character random alphanumeric id
    return Math.random().toString(36).substr(2, 9);
  }
  concat(...videos: Video[]) {
    const id = this.generateRandomId();
    /**
     * Create a reference video for the group operation
     */
    const video = new Video({ id, type: "intermediate", bucket: "", sequence: this._videos.length, key: "" });
    this._videos.push({ type: "group", videos, operationType: "concat", id, referenceVideo: video });
    return video;
  }
  splitscreen(...videos: Video[]) {
    const id = this.generateRandomId();
    /**
     * Create a reference video for the group operation
     */
    const video = new Video({ id, type: "intermediate", bucket: "", sequence: this._videos.length, key: "" });
    this._videos.push({ type: "group", videos, operationType: "splitscreen", id, referenceVideo: video });
    return video;
  }

  async process(): Promise<any> {
    // Get all the inputs
    const inputs = this._getInputs();
    // Get all the operations in sequence of execution
    const filters = this._getOperations();
    const json = { inputs, filters };
    this._videos = [];
    await this._xelpRequest.post({ data: json });
    return json;
  }

  private _getInputs(): Input[] {
    const singleVideos = this._videos.filter((video) => video.type == "video") as SingleVideo[];
    return singleVideos.map((video) => {
      return video.video._getSource();
    });
  }

  private _getOperations() {
    const inputs = this._getInputs();
    const filters: any = [];
    this._videos.forEach((video) => {
      if (video.type == "video") {
        filters.push(this._getSingleVideoOperation(video.video, inputs));
      } else {
        // in case of multi video operation like concat or splitscreen, we need to get the operations of all the videos
        const outputs = this._getMultiVideoOperation(video, inputs).flat();
        filters.push(...outputs);
      }
    });
    return filters;
  }

  private _getSingleVideoOperation(video: VideoClassType, inputs: Input[]) {
    const filters = video._getOperations();
    return filters;
  }
  private _getMultiVideoOperation(video: GroupVideo, inputs: Input[]) {
    const { videos, referenceVideo, id, operationType } = video;
    const operations = videos
      .map((video) => {
        const operations = video._getOperations();
        if (operations.length == 0) {
          /**
           * If the video has no operations, then we need to copy the video
           */
          video.copy();
          return video._getOperations();
        }
        return operations;
      })
      .flat();
    return [
      {
        out: [referenceVideo._getSource().id],
        params: {},
        in: operations.map((operation) => operation.out[0]),
        type: operationType,
      },
    ];
  }
}
