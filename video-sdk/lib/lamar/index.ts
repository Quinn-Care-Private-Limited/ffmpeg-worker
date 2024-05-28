import { Asset } from "../asset";
import ClientKey from "../client-key";
import Pipeline from "../pipeline";
import { LamarRequest } from "../request";
import { JobStatusCheck } from "../status-check";
import Tag from "../tag";
import TagKey from "../tag-key";
import { Filter, GroupVideo, LamarInput, LamarProcess, OverlayFilterParams, SingleVideo, XelpVidoes } from "../types";
import { LamarUtils } from "../util";
import { Video } from "../video";
import Canvas from "../canvas";
type Input = { id: string; type: "source" | "canvas"; objects?: any; properties?: any };
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
      uid: payload.id,
    });
    this._videos.push({ type: "video", video, uid: payload.id });
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
  overlay({ videos, params }: { videos: (Video | Canvas)[]; params: OverlayFilterParams }) {
    const uid = LamarUtils.generateRandomId(4);
    /**
     * Create a reference video for the group operation
     */
    const video = new Video({ uid, type: "intermediate", sequence: this._videos.length, id: "" });
    this._videos.push({ type: "group", videos, operationType: "overlay", uid, referenceVideo: video, params });
    return video;
  }

  transition(...videos: Video[]) {
    const uid = LamarUtils.generateRandomId(4);
    /**
     * Create a reference video for the group operation
     */
    const video = new Video({ uid, type: "intermediate", sequence: this._videos.length, id: "" });
    this._videos.push({ type: "group", videos, operationType: "transition", uid, referenceVideo: video });
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

  async process(targetVideo: Video, payload: LamarProcess): Promise<any> {
    const filters = this.getFilters(targetVideo);
    const uniqueFilters = filters
      .filter((filter, index, self) => self.findIndex((t) => t.filterId === filter.filterId) === index)
      .map((filter) => {
        const { filterId, ...rest } = filter;
        return rest;
      });
    const inputs = this._getInputs().filter((input) => {
      return filters.some((filter) => filter.in.includes(input.id));
    }, []);
    return this.request({
      data: {
        options: payload,
        inputs,
        filters: uniqueFilters,
      },
      url: "/asset/process-asset",
      method: "POST",
    });
  }

  private getFilters(targetVideo: Video) {
    const source = targetVideo._getSource();
    if (source.type == "source") {
      const filters = this._getSingleVideoOperation(targetVideo);
      return filters;
    } else {
      const { uid } = source;
      const data: Filter[] = targetVideo._getOperations().flat();
      const video = this._videos.find((video) => video.uid == uid) as GroupVideo;
      if (!video) {
        throw new Error("Video not found");
      }
      const { videos, referenceVideo } = video;
      data.push({
        type: video.operationType,
        params: video.params,
        in: videos.map((video) => {
          if (video instanceof Canvas) {
            return video.getId();
          }
          return video._getOutputIdentifier();
        }),
        out: [referenceVideo._getSource().uid],
        filterId: LamarUtils.generateRandomId(4),
      });
      for (let i = 0; i < videos.length; i++) {
        if (videos[i] instanceof Video) {
          const video = videos[i] as Video;
          const source = video._getSource();
          if (source.type == "source") {
            data.push(...this._getSingleVideoOperation(videos[i] as Video));
          } else {
            const operations = this._getMultiVideoOperation(videos[i] as Video);
            data.push(...operations.flat());
          }
        }
      }
      return data;
      // console.log(data);
    }
  }

  private _getSingleVideoOperation(video: Video) {
    return video._getOperations();
  }
  private _getMultiVideoOperation(video: Video) {
    return this.getFilters(video);
  }
  private _getInputs(): Input[] {
    const singleVideos = this._videos.filter((video) => video.type == "video") as SingleVideo[];
    const groupedVideos = this._videos.filter((video) => video.type == "group") as GroupVideo[];
    const canvases: Input[] = [];
    groupedVideos.forEach((group) => {
      group.videos.forEach((video) => {
        if (video instanceof Canvas) {
          canvases.push({
            id: video.getId(),
            type: "canvas",
            objects: video.getObjects().map((object) => {
              return {
                properties: {
                  ...object.getProperties(),
                  destroyAt: object.getDestroyAt(),
                },
                animations: object.getAnimations(),
              };
            }),
            properties: video.getProperties(),
          });
        }
      });
    });
    const singleVideoId: Input[] = singleVideos.map((video) => {
      return { id: video.video._getSource().id, type: "source" };
    });
    return singleVideoId.concat(canvases);
  }

  subscribe(jobId: string, callback: (data: any) => void) {
    return this.statusChecker.subscribe(jobId, callback);
  }

  unsubscribe(jobId: string) {
    return this.statusChecker.unsubscribe(jobId);
  }
}
