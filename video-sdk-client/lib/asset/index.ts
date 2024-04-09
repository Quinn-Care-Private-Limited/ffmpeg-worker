import { LamarRequest } from "../request";
import { AssetListFilter, AssetListResponse, AssetResponse, LamarCreateAsset, LamarCreateAssetResponse } from "./types";

export class Asset extends LamarRequest {
  constructor({ apiKey }: { apiKey: string }) {
    super({ apiKey });
  }

  async assetByHandle({ handle }: { handle: string }): Promise<AssetResponse | null> {
    return this.request({
      method: "GET",
      url: `/asset/get-by-handle/${handle}`,
    });
  }
  async assetById({ id }: { id: string }): Promise<AssetResponse | null> {
    return this.request({
      method: "GET",
      url: `/asset/get/${id}`,
    });
  }
  async list(payload?: AssetListFilter): Promise<AssetListResponse> {
    return this.request({
      method: "POST",
      url: `/asset/list`,
      params: payload,
    });
  }
  async validateHandles({ handles }: { handles: string[] }) {
    return this.request({
      method: "POST",
      url: `/asset/validate-names`,
      data: {
        fileNames: handles,
      },
    });
  }
}
