import { Asset } from "../asset";
import ClientKey from "../client-key";
import Pipeline from "../pipeline";
import { LamarRequest } from "../request";
import { JobStatusCheck } from "../status-check";
import Tag from "../tag";
import TagKey from "../tag-key";
import { Filter, GroupVideo, LamarInput, LamarProcess, SingleVideo, XelpVidoes } from "../types";
import { LamarUtils } from "../util";
import { VideoClassType, Video } from "../video";
type Input = { id: string };
export class Lamar extends LamarRequest {
  private _videos: XelpVidoes[];
  private statusChecker: JobStatusCheck;
  public asset: Asset;
  public tagKey: TagKey;
  public tag: Tag;
  public pipeline: Pipeline;
  public clientKey: ClientKey;
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
    this.pipeline = new Pipeline({ apiKey });
    this.clientKey = new ClientKey({ apiKey });
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
    const video = new Video({ uid, type: "intermediate", sequence: this._videos.length, id: "" });
    this._videos.push({ type: "group", videos, operationType: "concat", uid, referenceVideo: video });
    return video;
  }
  vstack(...videos: Video[]) {
    const uid = LamarUtils.generateRandomId(4);
    /**
     * Create a reference video for the group operation
     */
    const video = new Video({ uid, type: "intermediate", sequence: this._videos.length, id: "" });
    this._videos.push({ type: "group", videos, operationType: "vstack", uid, referenceVideo: video });
    return video;
  }

  hstack(...videos: Video[]) {
    const uid = LamarUtils.generateRandomId(4);
    /**
     * Create a reference video for the group operation
     */
    const video = new Video({ uid, type: "intermediate", sequence: this._videos.length, id: "" });
    this._videos.push({ type: "group", videos, operationType: "hstack", uid, referenceVideo: video });
    return video;
  }

  async process(video: Video, payload: LamarProcess): Promise<any> {
    // Get all the inputs
    const inputs = this._getInputs();
    // Get all the operations in sequence of execution
    const filters: Filter[] = this._getOperations().flat();
    const json = this.getFilters(filters, video, inputs);
    // console.log(JSON.stringify({ filters, inputs }, null, 2));
    // return this.request({
    //   data: {
    //     ...json,
    //     options: payload,
    //   },
    //   url: "/asset/process-asset",
    //   method: "POST",
    // });
  }

  private getFilters(filters: Filter[], targetVideo: Video, sourceInputs: Input[]) {
    const source = targetVideo._getSource();
    if (source.type == "source") {
      const { id, sequence, uid, type } = source;
      const input = sourceInputs[sequence!];
      const filters = targetVideo
        ._getOperations()
        .flat()
        .map((filter) => {
          // check if the filterInputs contains string with $
          const originalInputIndex = filter.in.findIndex((input) => input.startsWith("$"));
          if (originalInputIndex > -1) {
            filter.in[originalInputIndex] = `$0`;
          }
          return {
            ...filter,
          };
        });
      return {
        inputs: [input],
        filters: filters,
      };
    } else {
      // find filter that outputs the targetVideo that is
      const targetVideoFilter = filters.find((filter) => filter.out[0] == source.uid);
      if (!targetVideoFilter) {
        throw new Error("Target video filter not found");
      }
      // now we need to find the inputs of the targetVideo
      const targetVideoInputs = targetVideoFilter.in;
      const data: Filter[] = [];
      console.log(this._videos, targetVideoInputs);
      // this._videos.forEach((video) => {
      //   console.log(video);
      // });
      for (let i = 0; i < targetVideoInputs.length; i++) {}
    }
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
      return { id: video.video._getSource().id };
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
      return video._getOperations().flat();
    }
    return filters;
  }
  private _getMultiVideoOperation(video: GroupVideo, inputs: Input[]) {
    const { videos, referenceVideo, uid, operationType } = video;
    const outputs = videos
      .map((video) => {
        const source = video._getSource();
        if (video._getOperations().length == 0) {
          return [`$${source.sequence}`];
        }
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
