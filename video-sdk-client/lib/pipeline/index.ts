import { LamarRequest } from "../request";
import type { Pipeline } from "./types";
export default class PipelineClass extends LamarRequest {
  constructor({ apiKey }: { apiKey: string }) {
    super({ apiKey });
  }

  async list(): Promise<Pipeline[]> {
    return this.request({
      method: "GET",
      url: "/pipeline/list",
    });
  }
}
