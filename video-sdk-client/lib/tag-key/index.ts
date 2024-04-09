import { LamarRequest } from "../request";
import { CreateTagKey, ListTagKey, TagKeyListResponse, TagKeyType, UpdateTagKey } from "./types";

export default class TagKey extends LamarRequest {
  constructor({ apiKey }: { apiKey: string }) {
    super({ apiKey });
  }
  async list(filters?: ListTagKey): Promise<TagKeyListResponse> {
    return this.request({
      method: "GET",
      url: "/tagKey/list",
      params: filters,
    });
  }
}
