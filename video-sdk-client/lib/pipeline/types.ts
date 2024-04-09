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
