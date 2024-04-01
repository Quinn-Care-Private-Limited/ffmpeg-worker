import { VideoClassType } from "./video";

export type IVideo = {
  id: string;
  type: "source" | "intermediate";
  sequence?: number;
};
export type LamarInput = {
  bucket: string;
  key: string;
};

export interface LamarVideoInput {
  id: string;
  type: "source" | "intermediate";
  sequence?: number;
}
export type VideoOperationTypes = "trim" | "crop" | "concat" | "blur" | "sharp" | "scale" | "splitscreen" | "copy";

type SplitScreen = { type: "splitscreen" };
type Concat = { type: "concat" };

export type VideoOperation = {
  out: string[];
  in: string[];
  params: Record<string, any>;
  type: VideoOperationTypes;
};

export interface Operation {
  name: string;
  inputs: string[];
  outputName: string;
  params: VideoOperation[];
}

export type ProcessOperation = {
  videos: VideoClassType[];
} & (Concat | SplitScreen);

export type CombinedOperation = {
  name: string;
  inputs: string[];
  outputName: string;
  params: ProcessOperation[];
};
export type GroupVideo = {
  type: "group";
  videos: VideoClassType[];
  operationType: "concat" | "splitscreen";
  id: string;
  referenceVideo: VideoClassType;
};
export type SingleVideo = { type: "video"; video: VideoClassType };
export type XelpVidoes = {} & (GroupVideo | SingleVideo);
