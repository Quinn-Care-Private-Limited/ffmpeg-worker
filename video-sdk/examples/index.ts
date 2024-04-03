import { Lamar } from "../lib";
// Example 2
const lamar = new Lamar({ apiKey: "b8ff590052b699843e0f24fa1eabf8" });

(async () => {
  // Example 2 - Scale and then trim a video
  try {
    // Example 1
    await lamar.tagKey.delete({ id: "clujkd16a000bu2jp3748s7n8" });
  } catch (err) {
    console.log(`err`, err);
  }
})();
