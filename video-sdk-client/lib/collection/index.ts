import { LamarRequest } from "../request";
import { SearchCollectionParams } from "./types";
export default class Collection extends LamarRequest {
  constructor({ apiKey }: { apiKey: string }) {
    super({ apiKey });
  }

  async list() {
    return this.request({
      method: "POST",
      url: "/collection/list",
    });
  }
  async search(filters: Partial<SearchCollectionParams>) {
    return this.request({
      method: "get",
      url: "/collection/search",
      params: filters,
    });
  }
  async getByHandle(handle: string) {
    return this.request({
      method: "get",
      url: `/collection/get-by-handle/${handle}`,
    });
  }
}
