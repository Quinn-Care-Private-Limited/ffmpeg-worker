import { processHandler } from "handlers/canvas";

const json = {
  frameRate: 60,
  backgroundColor: "#fff",
  dimensions: {
    width: 1920,
    height: 1080,
  },
  nodes: [
    {
      id: 20,
      start: 0,
      end: 5,
      type: "video",
      config: {
        src: "test/sources/source0.mp4",
        playbackRate: 1,
        trimStart: 0,
        trimEnd: 5,
        muted: false,
      },
      initialAttrs: {
        x: 960,
        y: 540,
        scaleX: 0.8881578947368421,
        scaleY: 0.8881578947368421,
        rotation: 0,
        alpha: 1,
        tint: 16777215,
        pivotX: 416,
        pivotY: 608,
        skewX: 0,
        skewY: 0,
      },
      keyframes: [],
    },
  ],
};

async function main() {
  const resp = await processHandler({ json, startTime: 0, endTime: 5, fps: 1, output: "frames" });
  console.log(resp);
}

main();
