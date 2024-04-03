import { Lamar } from "../lib";
// Example 2
const lamar = new Lamar({ apiKey: "b8ff590052b699843e0f24fa1eabf8" });

(async () => {
  // Example 2 - Scale and then trim a video
  try {
    // const tags = await lamar.tag.list();
    const tags = await lamar.tag.list();
    await lamar.asset.addTags({
      id: "cs4sfz28r5rplefthzd54j1de",
      tagIds: ["cs4sfz28r5rplefthzd54j1de", "cs4sfz28r5rplefthzd54j1de"],
    });
    const assets = await lamar.asset.list();
    console.log(assets);
  } catch (err) {
    console.log(`err`, err);
  }
})();
