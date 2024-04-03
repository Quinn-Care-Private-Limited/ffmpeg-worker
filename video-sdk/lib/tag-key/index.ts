import { LamarRequest } from "../request";
import { CreateTagKey, ListTagKey, TagKeyListResponse, UpdateTagKey } from "./types";

export default class TagKey extends LamarRequest {
  constructor({ apiKey }: { apiKey: string }) {
    super({ apiKey });
  }

  async create(payload: CreateTagKey): Promise<TagKey> {
    return this.request({
      method: "POST",
      url: "/api/tagKey/create",
      data: {
        datatype: payload.dataType,
        name: payload.name,
      },
    });
  }
  async update(payload: UpdateTagKey): Promise<TagKey> {
    return this.request({
      method: "POST",
      url: "/api/tagKey/update",
      data: payload,
    });
  }
  async list(filters?: ListTagKey): Promise<TagKeyListResponse> {
    return this.request({
      method: "GET",
      url: "/api/tagKey/list",
      params: filters,
    });
  }
  async delete({ id }: { id: string }): Promise<null> {
    return this.request({
      method: "DELETE",
      url: "/api/tagKey/delete",
      data: {
        tagKeyId: id,
      },
    });
  }
}
