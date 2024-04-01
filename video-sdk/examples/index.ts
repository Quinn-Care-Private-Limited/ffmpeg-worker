import { Lamar } from "../lib";
(async function () {
  // Example 1
  const lamar = new Lamar({ apiKey: "test_api_key" });

  const video1 = lamar.input({ assetId: "1" }).scale({ width: 100, height: 100 });
  const video2 = lamar.input({ assetId: "2" }).scale({ width: 100, height: 100 });
  const video3 = lamar.input({ assetId: "3" });
  const v3 = lamar.splitscreen(video2, video1, video3).scale({ width: 100, height: 100 });

  const job = await lamar.process({
    output: "mp4",
  });
  console.log(JSON.stringify(job, null, 2));
})();
