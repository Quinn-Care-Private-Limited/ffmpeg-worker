import { Lamar } from "../lib";
// Example 2
const lamar = new Lamar({ apiKey: "7b61d080d7139f17e23663cfa57e6f" });

(async () => {
  // Example 2 - Scale and then trim a video
  try {
    const data = await lamar.asset.getSignedUrl({
      contentType: "video/mp4",
      extension: "mp4",
      handle: Math.random().toString(36).substring(7),
      name: Math.random().toString(36).substring(7),
      type: "VIDEO",
      origin: "http://localhost:5173",
    });
  } catch (err) {
    console.log(`err`, err);
  }
})();
