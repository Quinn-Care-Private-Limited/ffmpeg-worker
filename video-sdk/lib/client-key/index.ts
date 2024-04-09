import { LamarRequest } from "../request";
import type { ClientKey, CreateClientKey } from "./types";
export default class ClientKeyClass extends LamarRequest {
  constructor({ apiKey }: { apiKey: string }) {
    super({ apiKey });
  }

  async create(payload: CreateClientKey): Promise<ClientKey> {
    return this.request({
      method: "POST",
      url: "/client-key/create",
      data: payload,
    });
  }

  async list(): Promise<ClientKey[]> {
    return this.request({
      method: "GET",
      url: "/client-key/list",
    });
  }
  async delete({ id, environmentId }: { id: string; environmentId: string }): Promise<null> {
    return this.request({
      method: "DELETE",
      url: "/client-key/delete",
      data: {
        id,
        environmentId,
      },
    });
  }
}
