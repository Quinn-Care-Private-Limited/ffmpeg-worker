import { Lamar } from "../lib";
// Example 2
const lamar = new Lamar({ apiKey: "7b61d080d7139f17e23663cfa57e6f" });

(async () => {
  // Example 2 - Scale and then trim a video
  try {
    const video1 = lamar.input({ id: "test" }).scale({ width: 100, height: 100 });
    const video2 = lamar.input({ id: "test2" });
    const r = lamar.input({ id: "test3" });

    const video4 = lamar.hstack(video1, video2).scale({ width: 100, height: 100 });
    const data = await lamar.process(video4, {
      output: "mp4",
      name: "test",
      handle: "test",
      encoding: {},
    });
  } catch (err) {
    console.log(`err`, err);
  }
})();
