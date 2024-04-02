import { LamarRequest } from "../request";
import { JobStatusCheck } from "../status-check";
import { Filter, GroupVideo, LamarInput, LamarProcess, SingleVideo, XelpVidoes } from "../types";
import { LamarUtils } from "../util";
import { VideoClassType, Video } from "../video";
type Input = { assetId: string };
export class Lamar extends LamarRequest {
  private _videos: XelpVidoes[];
  private statusChecker: JobStatusCheck;
  constructor({ apiKey }: { apiKey: string }) {
    super({ apiKey });
    if (!apiKey) {
      throw new Error("API Key is required");
    }
    this.statusChecker = new JobStatusCheck({ apiKey });
    this._videos = [];
  }
  input(payload: LamarInput) {
    const video = new Video({
      ...payload,
      type: "source",
      sequence: this._videos.length,
      id: LamarUtils.generateRandomId(4),
    });
    this._videos.push({ type: "video", video });
    return video;
  }

  concat(...videos: Video[]) {
    const id = LamarUtils.generateRandomId(4);
    /**
     * Create a reference video for the group operation
     */
    const video = new Video({ id, type: "intermediate", sequence: this._videos.length, assetId: "" });
    this._videos.push({ type: "group", videos, operationType: "concat", id, referenceVideo: video });
    return video;
  }
  vstack(...videos: Video[]) {
    const id = LamarUtils.generateRandomId(4);
    /**
     * Create a reference video for the group operation
     */
    const video = new Video({ id, type: "intermediate", sequence: this._videos.length, assetId: "" });
    this._videos.push({ type: "group", videos, operationType: "vstack", id, referenceVideo: video });
    return video;
  }

  hstack(...videos: Video[]) {
    const id = LamarUtils.generateRandomId(4);
    /**
     * Create a reference video for the group operation
     */
    const video = new Video({ id, type: "intermediate", sequence: this._videos.length, assetId: "" });
    this._videos.push({ type: "group", videos, operationType: "hstack", id, referenceVideo: video });
    return video;
  }

  async process(payload: LamarProcess): Promise<any> {
    // Get all the inputs
    const inputs = this._getInputs();
    // Get all the operations in sequence of execution
    const filters: Filter[] = this._getOperations().flat();
    const json = { inputs, filters, options: payload };
    this._videos = [];
    return this.request({
      data: json,
      url: "/jobs",
    });
  }

  private _getInputs(): Input[] {
    const singleVideos = this._videos.filter((video) => video.type == "video") as SingleVideo[];
    return singleVideos.map((video) => {
      return { assetId: video.video._getSource().assetId };
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
    const filters = video._getOperations().flat();
    if (filters.length == 0) {
      video.copy();
      return video._getOperations().flat();
    }
    return filters;
  }
  private _getMultiVideoOperation(video: GroupVideo, inputs: Input[]) {
    const { videos, referenceVideo, id, operationType } = video;
    const outputs = videos
      .map((video) => {
        const outputs = video._getOutputIdentifier();
        if (outputs.length == 0) {
          /**
           * If the video has no operations, then we need to copy the video
           */
          return video._getOutputIdentifier();
        }
        return outputs;
      })
      .flat();
    const output = referenceVideo._getSource().id;
    const singleVideoOperation = referenceVideo._getOperations().flat();
    if (singleVideoOperation && singleVideoOperation.length) {
      singleVideoOperation[0].in = [output];
    }
    return [
      {
        out: [output],
        params: {},
        in: outputs,
        type: operationType,
      },
      ...singleVideoOperation,
    ];
  }

  subscribe(jobId: string, callback: (data: any) => void) {
    return this.statusChecker.subscribe(jobId, callback);
  }

  unsubscribe(jobId: string) {
    return this.statusChecker.unsubscribe(jobId);
  }
}
