import { Lamar } from "../lib";
// Example 2
const lamar = new Lamar({ apiKey: "86e61c5274247afcdd7b5ac13293e4" });

(async () => {
  // Example 2 - Scale and then trim a video
  try {
    // const data = await lamar.asset.list();
    const video1 = lamar.input({ assetId: "cu85gh5g60ji82ai0utgwru6v" });
    const video2 = lamar.input({ assetId: "cu85gh5g60ji82ai0utgwru6sadv" });
    const video3 = lamar.concat(video1, video2);
    const newAssetId = await lamar.process(video3, { output: "mp4", handle: "dasdasd", name: "dasdads" });

    // lamar.subscribe(newAssetId, (data) => {});
  } catch (err) {
    console.log(`err`, err);
  }
})();
