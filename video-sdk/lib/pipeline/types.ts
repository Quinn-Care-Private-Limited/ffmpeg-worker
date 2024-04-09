export type Pipeline = {
  id: string;
  name: string;
  handle: string;
  config: PipelineConfig;
  isDefault: boolean;
  isHidden: boolean;
  assetPath: string;
  keepParentPath: boolean;
  assetHandleType: string;
  assetHandle: string;
  extension: string;
  environmentId: string;
  createdAt: string;
  updatedAt: string;
  parentPipelineId: string;
};

type PipelineConfig = {
  filters: Record<string, unknown>[];
  encoding: Record<string, unknown>;
};

export type CreatePipeline = {
  name: string;
  handle: string;
  isDefault: boolean;
  config: PipelineConfig;
  extension: string;
  parentPipelineId?: string;
  assetPath: string;
  assetHandle: string;
  keepParentPath: boolean;
  assetHandleType: "AUTO_ID" | "APPENDED_HANDLE" | "FILE_HANDLE" | "FIXED_HANDLE";
};
