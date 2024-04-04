import { Asset } from "../asset";
import { LamarRequest } from "../request";
import { JobStatusCheck } from "../status-check";
import Tag from "../tag";
import TagKey from "../tag-key";
import { Filter, GroupVideo, LamarInput, LamarProcess, SingleVideo, XelpVidoes } from "../types";
import { LamarUtils } from "../util";
import { VideoClassType, Video } from "../video";
type Input = { assetId: string };
export class Lamar extends LamarRequest {
  private _videos: XelpVidoes[];
  private statusChecker: JobStatusCheck;
  public asset: Asset;
  public tagKey: TagKey;
  public tag: Tag;
  constructor({ apiKey }: { apiKey: string }) {
    super({ apiKey });
    if (!apiKey) {
      throw new Error("API Key is required");
    }
    this.statusChecker = new JobStatusCheck({ apiKey });
    this._videos = [];
    this.asset = new Asset({ apiKey });
    this.tagKey = new TagKey({ apiKey });
    this.tag = new Tag({ apiKey });
  }
  input(payload: LamarInput) {
    const video = new Video({
      ...payload,
      type: "source",
      sequence: this._videos.length,
      uid: LamarUtils.generateRandomId(4),
    });
    this._videos.push({ type: "video", video });
    return video;
  }

  concat(...videos: Video[]) {
    const uid = LamarUtils.generateRandomId(4);
    /**
     * Create a reference video for the group operation
     */
    const video = new Video({ uid, type: "intermediate", sequence: this._videos.length, assetId: "" });
    this._videos.push({ type: "group", videos, operationType: "concat", uid, referenceVideo: video });
    return video;
  }
  vstack(...videos: Video[]) {
    const uid = LamarUtils.generateRandomId(4);
    /**
     * Create a reference video for the group operation
     */
    const video = new Video({ uid, type: "intermediate", sequence: this._videos.length, assetId: "" });
    this._videos.push({ type: "group", videos, operationType: "vstack", uid, referenceVideo: video });
    return video;
  }

  hstack(...videos: Video[]) {
    const uid = LamarUtils.generateRandomId(4);
    /**
     * Create a reference video for the group operation
     */
    const video = new Video({ uid, type: "intermediate", sequence: this._videos.length, assetId: "" });
    this._videos.push({ type: "group", videos, operationType: "hstack", uid, referenceVideo: video });
    return video;
  }

  async process(video: Video, payload: LamarProcess): Promise<any> {
    // Get all the inputs
    const inputs = this._getInputs();
    // Get all the operations in sequence of execution
    const filters: Filter[] = this._getOperations().flat();
    const json = this.getFilters(filters, video, inputs);

    return this.request({
      data: {
        ...json,
        options: payload,
      },
      url: "/asset/process-asset",
      method: "POST",
    });
  }

  private getFilters(filters: Filter[], video: Video, sourceInputs: Input[]) {
    const { uid } = video._getSource();
    const videoFilters = filters.find((filter) => filter.out.includes(uid));
    const finalFilters: Filter[] = [];
    if (!videoFilters) {
      const filters = video._getOperations();
      const inputs = filters.map((item) => item.in);
      const originalInputsIndexes = this._getSourceInputs(inputs);
      if (!originalInputsIndexes.length) return;
      return {
        inputs: sourceInputs.filter((input, index) => originalInputsIndexes.includes(index)).flat(),
        filters,
      };
    }
    finalFilters.push(videoFilters);
    const finalInputs: Input[] = [];
    for (let i = 0; i < videoFilters.in.length; i++) {
      const original = filters.find((filter) => filter.out.includes(videoFilters.in[i]));
      if (original) {
        const inputs = this._getSourceInputs([original.in]);
        if (inputs.length) {
          const input = sourceInputs.filter((input, index) => inputs.includes(index));
          finalInputs.push(...input);
        }
        finalFilters.push(original);
      }
    }
    return { inputs: finalInputs, filters: finalFilters };
  }

  private _getSourceInputs(inputs: string[][]) {
    const withDollar = inputs.filter((inputs) => {
      // check if any input name starts with $
      return inputs.some((input) => input.startsWith("$"));
    });
    return withDollar.flat().map((item) => +item.replace("$", ""));
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
    const { videos, referenceVideo, uid, operationType } = video;
    const outputs = videos
      .map((video) => {
        const source = video._getSource();
        if (source.type == "intermediate") {
          return [source.uid];
        }
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
    const output = referenceVideo._getSource().uid;
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
