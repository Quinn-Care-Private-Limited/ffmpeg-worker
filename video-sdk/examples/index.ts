import { Lamar } from "../lib";
// Example 2
const lamar = new Lamar({ apiKey: "b8ff590052b699843e0f24fa1eabf8" });

(async () => {
  // Example 2 - Scale and then trim a video
  try {
    const assets = await lamar.asset.list({ tagId: "60f4b1b1c4b4f4001f1b1b1b" });
  } catch (err) {
    console.log(`err`, err);
  }
})();
