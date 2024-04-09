import { LamarRequest } from "../request";
import { AssetListFilter, AssetListResponse, AssetResponse, LamarCreateAsset, LamarCreateAssetResponse } from "./types";

export class Asset extends LamarRequest {
  constructor({ apiKey }: { apiKey: string }) {
    super({ apiKey });
  }
  async getSignedUrl(payload: LamarCreateAsset): Promise<LamarCreateAssetResponse> {
    const { handle, name, contentType, pipelineIds, extension, type } = payload;
    return this.request({
      method: "POST",
      url: "/asset/upload",
      data: {
        handle,
        name,
        contentType,
        extension,
        pipelineIds: pipelineIds || [],
        type,
      },
    });
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
  async delete({ id }: { id: string }) {
    return this.request({
      method: "DELETE",
      url: `/asset/delete`,
      data: {
        id,
      },
    });
  }
  async addTags({ id, tagIds }: { id: string; tagIds: string[] }) {
    return this.request({
      method: "PUT",
      url: `/asset/update/${id}`,
      data: {
        assetData: {
          assetTags: tagIds.map((tagId) => ({ tagId })),
        },
      },
    });
  }
  async removeTag({ id, tagId }: { id: string; tagId: string }) {
    return this.request({
      method: "PUT",
      url: `/asset/remove-tag`,
      data: {
        assetId: id,
        tagId,
      },
    });
  }
}