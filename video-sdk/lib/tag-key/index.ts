import { LamarRequest } from "../request";
import { CreateTagKey, ListTagKey, TagKeyListResponse, TagKeyType, UpdateTagKey } from "./types";

export default class TagKey extends LamarRequest {
  constructor({ apiKey }: { apiKey: string }) {
    super({ apiKey });
  }

  async create(payload: CreateTagKey): Promise<TagKeyType> {
    return this.request({
      method: "POST",
      url: "/tagKey/create",
      data: {
        datatype: payload.dataType,
        name: payload.name,
      },
    });
  }
  async update(payload: UpdateTagKey): Promise<TagKey> {
    return this.request({
      method: "POST",
      url: "/tagKey/update",
      data: payload,
    });
  }
  async list(filters?: ListTagKey): Promise<TagKeyListResponse> {
    return this.request({
      method: "GET",
      url: "/tagKey/list",
      params: filters,
    });
  }
  async delete({ id }: { id: string }): Promise<null> {
    return this.request({
      method: "DELETE",
      url: "/tagKey/delete",
      data: {
        tagKeyId: id,
      },
    });
  }
}