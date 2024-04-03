export type LamarCreateAsset = {
  pipelineIds?: string[];
  handle: string;
  name: string;
  contentType: string;
  extension: string;
  type: "IMAGE" | "VIDEO";
};
