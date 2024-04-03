import { LamarRequest } from "../request";
import { LamarCreateAsset } from "./types";

export class Asset extends LamarRequest {
  constructor({ apiKey }: { apiKey: string }) {
    super({ apiKey });
  }
  async getSignedUrl(payload: LamarCreateAsset) {
    const { handle, name, contentType, pipelineIds, extension, type } = payload;
    return this.request({
      method: "POST",
      url: "/api/asset/upload",
      data: {
        handle,
        name,
        contentType,
        extension,
        pipelineIds: pipelineIds || [],
        type,
      },
    });
  }
}
