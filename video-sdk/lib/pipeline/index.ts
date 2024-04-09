import { LamarRequest } from "../request";
import type { CreatePipeline, Pipeline } from "./types";
export default class PipelineClass extends LamarRequest {
  constructor({ apiKey }: { apiKey: string }) {
    super({ apiKey });
  }

  async create(payload: CreatePipeline): Promise<Pipeline> {
    return this.request({
      method: "POST",
      url: "/pipeline/create",
      data: payload,
    });
  }

  async list(): Promise<Pipeline[]> {
    return this.request({
      method: "GET",
      url: "/pipeline/list",
    });
  }
  async delete({ id }: { id: string }): Promise<null> {
    return this.request({
      method: "POST",
      url: "/pipeline/delete",
      data: {
        id,
      },
    });
  }
}
