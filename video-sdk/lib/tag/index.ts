import { LamarRequest } from "../request";
import { TagKeyListResponse } from "../tag-key/types";
import { CreateTag, ListTagFilter } from "./types";

export default class Tag extends LamarRequest {
  constructor({ apiKey }: { apiKey: string }) {
    super({ apiKey });
  }

  async create({ tags }: { tags: CreateTag[] }) {
    return this.request({
      method: "POST",
      url: "/tags/create-multiple",
      data: {
        tags: tags.map((tag) => ({ value: tag.name, keyId: tag.tagKeyId })),
      },
    });
  }
  //   async update(payload: UpdateTagKey): Promise<TagKey> {
  //     return this.request({
  //       method: "POST",
  //       url: "/tagKey/update",
  //       data: payload,
  //     });
  //   }
  async list(filters?: ListTagFilter): Promise<TagKeyListResponse> {
    return this.request({
      method: "GET",
      url: "/tags/list",
      params: filters,
    });
  }
  async delete({ id }: { id: string }): Promise<null> {
    return this.request({
      method: "DELETE",
      url: "/tags/delete",
      data: {
        tagId: id,
      },
    });
  }
}