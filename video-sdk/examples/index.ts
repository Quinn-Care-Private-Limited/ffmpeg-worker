import { Lamar } from "../lib";
// Example 2
const lamar = new Lamar({ apiKey: "b8ff590052b699843e0f24fa1eabf8" });

(async () => {
  // Example 2 - Scale and then trim a video
  try {
    const video1 = lamar.input({ assetId: "tyuiojhgb67" });
    const outputAssetId = await lamar.process(video1, {
      output: "mp4",
      name: "video1",
      handle: "video1",
    });
    lamar.subscribe(outputAssetId, ({ message, ok, data }) => {
      console.log(data);
    });
  } catch (err) {
    console.log(`err`, err);
  }
})();
