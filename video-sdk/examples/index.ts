import { Lamar } from "../lib";
// Example 2
const lamar = new Lamar({ apiKey: "b8ff590052b699843e0f24fa1eabf8" });

(async () => {
  // Example 2 - Scale and then trim a video
  try {
    const jobId = "cluju80cx0002u27botgr0234";
    lamar.subscribe(jobId, (data) => {
      console.log(data);
    });
  } catch (err) {
    console.log(`err`, err);
  }
})();
