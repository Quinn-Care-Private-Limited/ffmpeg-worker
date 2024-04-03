import { Lamar } from "../lib";
// Example 2
const lamar = new Lamar({ apiKey: "0887bbe7d371a18be7aa7dc2768d86" });

(async () => {
  // Example 2 - Scale and then trim a video
  try {
    const data = await lamar.asset.getSignedUrl({
      handle: "kabutar2wwww44",
      name: "test",
      extension: "mp4",
      contentType: "video/mp4",
      type: "VIDEO",
    });
    console.log(data);
  } catch (err) {
    console.log("err", err);
  }
})();
