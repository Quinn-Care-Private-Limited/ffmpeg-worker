export type LamarCreateAsset = {
  pipelineIds?: string[];
  handle: string;
  name: string;
  contentType: string;
  extension: string;
  type: "IMAGE" | "VIDEO";
};

export type LamarCreateAssetResponse = {
  url: string;
  id: string;
  pipelineIds: string[];
  name: string;
  handle: string;
  extension: string;
  type: "IMAGE" | "VIDEO";
  createdAt: string;
  updatedAt: string;
  environmentId: string;
};

export type AssetResponse = {
  duration: number | null;
  status: string;
  keepSource: boolean;
  size: number | null;
  width: number | null;
  height: number | null;
  framerate: number | null;
  avgbitrate: number | null;
  sources: string[];
  assetTags: string[];
} & Pick<
  LamarCreateAssetResponse,
  "handle" | "name" | "createdAt" | "updatedAt" | "environmentId" | "extension" | "id" | "type"
>;

export type AssetListResponse = {
  data: AssetResponse[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
};

export type AssetListFilter = {
  currentPage?: number;
  pageSize?: number;
  searchText?: string;
  type?: "IMAGE" | "VIDEO" | "COLLECTION";
  tagKeyId?: string;
  tagId?: string;
};
