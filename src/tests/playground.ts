import { processHandler } from "handlers/canvas";

// const json = {
//   frameRate: 60,
//   backgroundColor: "#fff",
//   dimensions: {
//     width: 720,
//     height: 1280,
//   },
//   nodes: [
//     {
//       id: 20,
//       start: 0,
//       end: 5,
//       type: "video",
//       config: {
//         src: "test/sources/source0.mp4",
//         playbackRate: 1,
//         trimStart: 0,
//         trimEnd: 5,
//         muted: false,
//       },
//       initialAttrs: {
//         x: 0,
//         y: 0,
//         scaleX: 1,
//         scaleY: 1,
//         rotation: 0,
//         alpha: 1,
//         tint: 16777215,
//         pivotX: 0,
//         pivotY: 0,
//         skewX: 0,
//         skewY: 0,
//       },
//       keyframes: [],
//     },
//   ],
// };

const json = {
  frameRate: 15,
  backgroundColor: "#000000",
  dimensions: { width: 480, height: 644 },
  nodes: [
    {
      id: 86,
      start: 0,
      end: 3.658008,
      type: "video",
      config: {
        src: "https://storage.googleapis.com/yume-artifacts/sources/source1.mp4",
        playbackRate: 1,
        trimStart: 0.55,
        trimEnd: 4.208008,
        muted: false,
      },
      initialAttrs: {
        x: 240,
        y: 322,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        alpha: 1,
        tint: 16777215,
        pivotX: 240,
        pivotY: 322,
        skewX: 0,
        skewY: 0,
      },
      keyframes: [],
    },
    {
      id: 88,
      start: 3.658008,
      end: 7.366015999999998,
      type: "video",
      config: {
        src: "https://storage.googleapis.com/yume-artifacts/sources/source2.mp4",
        playbackRate: 1,
        trimStart: 1.4250000000000003,
        trimEnd: 5.1330079999999985,
        muted: false,
      },
      initialAttrs: {
        x: 240,
        y: 322,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        alpha: 1,
        tint: 16777215,
        pivotX: 240,
        pivotY: 322,
        skewX: 0,
        skewY: 0,
      },
      keyframes: [],
    },
    {
      id: 89,
      start: 7.366015999999998,
      end: 10.991015999999998,
      type: "video",
      config: {
        src: "https://storage.googleapis.com/yume-artifacts/sources/source1.mp4",
        playbackRate: 1,
        trimStart: 0,
        trimEnd: 3.625,
        muted: false,
      },
      initialAttrs: {
        x: 240,
        y: 322,
        scaleX: 0.39473684210526316,
        scaleY: 0.3946078431372549,
        rotation: 0,
        alpha: 1,
        tint: 16777215,
        pivotX: 608,
        pivotY: 816,
        skewX: 0,
        skewY: 0,
      },
      keyframes: [],
    },
    {
      id: 87,
      start: 10.991015999999998,
      end: 14.141016000000018,
      type: "video",
      config: {
        src: "https://storage.googleapis.com/yume-artifacts/sources/source2.mp4",
        playbackRate: 1,
        trimStart: 0,
        trimEnd: 3.15000000000002,
        muted: false,
      },
      initialAttrs: {
        x: 240,
        y: 322,
        scaleX: 0.39473684210526316,
        scaleY: 0.3946078431372549,
        rotation: 0,
        alpha: 1,
        tint: 16777215,
        pivotX: 608,
        pivotY: 816,
        skewX: 0,
        skewY: 0,
      },
      keyframes: [],
    },
  ],
};

async function main() {
  let resp = await processHandler({ json, startTime: 0, endTime: 4, fps: 10, output: "frames/chunk_0.mp4" });
  console.log(resp);
  // resp = await processHandler({
  //   json,
  //   startTime: 4,
  //   endTime: 8,
  //   fps: 10,
  //   output: "frames/chunk_1",
  // });
  // console.log(resp);
}

main();
