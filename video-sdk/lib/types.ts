import { VideoClassType } from "./video";

export type IVideo = {
  id: string;
  type: "source" | "intermediate";
};

export type VideoOperationTypes = "trim" | "crop" | "concat" | "blur" | "sharp" | "scale" | "splitscreen";

type Trim = { type: "trim"; start: number; end: number };
type Crop = { x: number; y: number; width: number; height: number; type: "crop" };
type Blur = { radius: number; type: "blur" };
type Sharp = { sigma: number; type: "sharp" };
type Scale = { width: number; height: number; type: "scale" };
type SplitScreen = { type: "splitscreen" };
type Concat = { type: "concat" };

export type VideoOperation = {} & (Trim | Crop | Blur | Sharp | Scale);

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