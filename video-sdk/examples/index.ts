import { Lamar } from "../lib";
// Example 2
const lamar = new Lamar({ apiKey: "b8ff590052b699843e0f24fa1eabf8" });

(async () => {
  // Example 2 - Scale and then trim a video
  try {
    const video1 = lamar
      .input({ assetId: "1" })
      .scale({ width: 100, height: 100 })
      .trim({ start: 0, end: 10 })
      .crop({ width: 100, height: 100, x: 0, y: 0 });
    const video2 = lamar.input({ assetId: "2" });
    const video3 = lamar.input({ assetId: "3" });
    const video4 = lamar.concat(video1, video2, video3);
    const video5 = lamar.input({ assetId: "4" });
    const video6 = lamar.input({ assetId: "5" });
    const video7 = lamar.vstack(video5, video6);
    const data = await lamar.process(video4, { output: "mp4" });
  } catch (err) {
    console.log(`err`, err);
  }
})();
