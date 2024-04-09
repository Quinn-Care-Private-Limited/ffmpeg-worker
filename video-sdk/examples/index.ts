import { Lamar } from "../lib";
// Example 2
const lamar = new Lamar({ apiKey: "7b61d080d7139f17e23663cfa57e6f" });

(async () => {
  // Example 2 - Scale and then trim a video
  try {
    const data = await lamar.pipeline.list();
    console.log(data);
  } catch (err) {
    console.log(`err`, err);
  }
})();
