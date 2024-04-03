import { Lamar } from "../lib";
// Example 2
const lamar = new Lamar({ apiKey: "b8ff590052b699843e0f24fa1eabf8" });

(async () => {
  // Example 2 - Scale and then trim a video
  try {
    const video1 = lamar.input({ assetId: "1" });
    const video2 = lamar.input({ assetId: "2" });
    const video3 = lamar.concat(video1, video2);
    const data = await lamar.process({ output: "mp4" });
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.log(`err`, err);
  }
})();
