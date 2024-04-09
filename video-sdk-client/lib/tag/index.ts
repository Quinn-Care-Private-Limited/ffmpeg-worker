import { LamarRequest } from "../request";
import { TagKeyListResponse } from "../tag-key/types";
import { CreateTag, ListTagFilter } from "./types";

export default class Tag extends LamarRequest {
  constructor({ apiKey }: { apiKey: string }) {
    super({ apiKey });
  }

  async list(filters?: ListTagFilter): Promise<TagKeyListResponse> {
    return this.request({
      method: "GET",
      url: "/tags/list",
      params: filters,
    });
  }
}
