import { GroupVideo, SingleVideo, XelpVidoes } from "../types";
import Video, { VideoClassType } from "../video";
import fs from "fs";
type Input = { id: string };
class Xelp {
  private videos: XelpVidoes[] = [];
  input({ id }: { id: string }) {
    const video = new Video({ id, type: "source" });
    this.videos.push({ type: "video", video });
    return video;
  }
  private generateRandomId() {
    // generate 9 character random alphanumeric id
    return Math.random().toString(36).substr(2, 9);
  }
  concat(...videos: Video[]) {
    const id = this.generateRandomId();
    const video = new Video({ id, type: "intermediate" });
    this.videos.push({ type: "group", videos, operationType: "concat", id, referenceVideo: video });
    return video;
  }
  splitscreen(...videos: Video[]) {
    const id = this.generateRandomId();
    const video = new Video({ id, type: "intermediate" });
    this.videos.push({ type: "group", videos, operationType: "splitscreen", id, referenceVideo: video });
    return video;
  }
  run() {
    const inputs = this.getInputs();
    const operations = this.getOperations();
    const json = { inputs, operations };
    fs.writeFileSync("xelp.json", JSON.stringify(json, null, 2));
  }
  private getInputs(): Input[] {
    const singleVideos = this.videos.filter((video) => video.type == "video") as SingleVideo[];
    return singleVideos.map((video) => {
      return { id: video.video.getId() };
    });
  }
  private getOperations() {
    const inputs = this.getInputs();
    const operations: any = [];
    this.videos.forEach((video) => {
      if (video.type == "video") {
        operations.push(this.getSingleVideoOperation(video.video, inputs));
      } else {
        const outputs = this.getMultieVideoOperation(video, inputs).flat();
        operations.push(...outputs);
      }
    });
    return operations;
  }

  private getSingleVideoOperation(video: VideoClassType, inputs: Input[]) {
    const operations = video.getOperations();
    const id = video.getId();
    const index = inputs.findIndex((item) => item!.id == id);
    const operationName = operations.length ? operations.map((operation) => operation.type).join("_") : `$${index}`;
    const outputName = operations.length ? `${operationName}_$${index}` : `$${index}`;
    return {
      name: operationName,
      inputs: [id],
      params: operations,
      outputName,
    };
  }
  private getMultieVideoOperation(video: GroupVideo, inputs: Input[]) {
    const { operationType, id, videos, referenceVideo } = video;
    const i = videos.map((video) => {
      const operations = video.getOperations();
      const index = inputs.findIndex((item) => item!.id == video.getId());
      const operationName = operations.length ? operations.map((operation) => operation.type).join("_") : `$${index}`;
      const outputName = operations.length ? `${operationName}_$${index}` : `$${index}`;
      return outputName;
    });

    const outputs = [
      {
        name: operationType,
        inputs: i,
        params: [],
        outputName: id,
      },
    ];
    if (video.referenceVideo.getOperations().length) {
      const referenceVideoOperations = this.getSingleVideoOperation(video.referenceVideo, inputs);
      return [...outputs, referenceVideoOperations];
    }
    return outputs;
  }
}

export default Xelp;
