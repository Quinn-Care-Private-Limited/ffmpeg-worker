import { CombinedOperation, Operation, ProcessOperation, VideoOperation } from "../types";
import Video from "../video";
import fs from "fs";
class Xelp {
  private videos: Video[] = [];
  private combinedOperations: ProcessOperation[] = [];

  input({ id }: { id: string }) {
    const video = new Video({ assetId: id });
    this.videos.push(video);
    return video;
  }
  concat(...videos: Video[]) {
    this.combinedOperations.push({
      type: "concat",
      videos,
    });
    return this;
  }
  splitscreen(...videos: Video[]) {
    this.combinedOperations.push({
      type: "splitscreen",
      videos,
    });
    return this;
  }
  run() {
    const inputs = this.getInputs();
    const operations = this.getOperations();
    const combinedOperations = this.getCombinedOperations(operations);
    const json = {
      inputs,
      operations: [...operations, ...combinedOperations],
    };
    fs.writeFileSync("xelp.json", JSON.stringify(json, null, 2));
  }
  private getInputs() {
    return this.videos.map((item) => ({ id: item.getId() }));
  }
  private getOperations(): Operation[] {
    const inputs = this.getInputs();
    return this.videos.map((video) => {
      const operations = video.getOperations();
      const id = video.getId();
      const index = inputs.findIndex((item) => item.id == id);
      const operationName = operations.map((operation) => operation.type).join("_");
      return {
        name: operationName,
        inputs: [`$${index}`],
        params: operations,
        outputName: `${operationName}_$${index}`,
      };
    });
  }

  private getCombinedOperations(operations: Operation[]): CombinedOperation[] {
    const inputsVideos = this.getInputs();
    return this.combinedOperations.map((item) => {
      const inputs = item.videos.map((video) => {
        const index = inputsVideos.findIndex((item) => item.id == video.getId());
        const outputName = operations.find((operation) => operation.inputs[0] == `$${index}`)?.outputName;
        return outputName!;
      });

      return {
        name: item.type,
        inputs,
        outputName: `${item.type}_${inputs.join("_")}`,
        params: [],
      };
    });
  }
}

export default Xelp;
