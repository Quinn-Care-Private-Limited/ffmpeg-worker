import { Lamar } from "../lib";
// Example 2
const lamar = new Lamar({ apiKey: "7b61d080d7139f17e23663cfa57e6f" });

(async () => {
  // Example 2 - Scale and then trim a video
  try {
    const video4 = lamar.input({ id: "test3" }).scale({ width: 100, height: 100 });
    const video1 = lamar.input({ id: "test" }).trim({ start: 0, end: 10 });
    const video2 = lamar.input({ id: "test2" }).padding({ x: 10, y: 10, width: 100, height: 100 });
    const hstack = lamar.hstack(video1, video2, video4);
    const video3 = lamar.concat(hstack, video2).crop({ x: 0, y: 0, width: 100, height: 100 });
    const data = await lamar.process(video3, {
      output: "mp4",
      name: "test",
      handle: "test",
      encoding: {},
    });
  } catch (err) {
    console.log(`err`, err);
  }
})();
