import { Lamar } from "../lib";
(async function () {
  // Example 1

  const lamar = new Lamar({ apiKey: "test_api_key" });
  // Single video, blur and scale
  const v0 = lamar.input({ bucket: "testBucket", key: "testVideos/original.mp4" }).blur({ radius: 80 });
  const v1 = lamar.input({ bucket: "testBucket", key: "testVideos/original1.mp4" }).scale({ height: 100, width: 100 });
  const v2 = lamar.input({ bucket: "testBucket", key: "testVideos/original2.mp4" }).scale({ height: 100, width: 100 });
  const v3 = lamar.input({ bucket: "testBucket", key: "testVideos/original3.mp4" });
  const v4 = lamar.concat(v0, v1, v2, v3);
  const data = await lamar.process(); // Submit the job to the server
  console.log(`here`, JSON.stringify(data, null, 2));
})();
