import { VideoClassType } from "./video";

export type IVideo = {
  uid: string;
  type: "source" | "intermediate";
  sequence?: number;
};
export type LamarInput = {
  id: string;
};

export type VideoOperationTypes =
  | "trim"
  | "crop"
  | "concat"
  | "blur"
  | "sharp"
  | "scale"
  | "vstack"
  | "hstack"
  | "copy"
  | "pad";

type SplitScreen = { type: "splitscreen" };
type Concat = { type: "concat" };

export type VideoOperation = {
  out: string[];
  in: string[];
  params: Record<string, any>;
  type: VideoOperationTypes;
  filterId: string;
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
  operationType: "concat" | "vstack" | "hstack";
  referenceVideo: VideoClassType;
  uid: string;
};
export type SingleVideo = { type: "video"; video: VideoClassType; uid: string };

export type XelpVidoes = {} & (GroupVideo | SingleVideo);

export type LamarProcess = {
  output: "mp4" | "m3u8";
  name: string;
  handle: string;
  encoding?: {
    crf?: number;
    bitrate?: number;
    vcodec?: string;
    acodec?: string;
    quality?: number;
    muted?: boolean;
    optimize?: boolean;
  };
};

export type Filter = {
  type: VideoOperationTypes;
  params: Record<string, any>;
  out: string[];
  in: string[];
  filterId: string;
};
