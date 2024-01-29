import { Xelp } from "../lib";
(async function () {
  // Example 1

  const xelp2 = new Xelp({ apiKey: "test_api_key" });
  // Single video, blur and scale
  xelp2.input({ id: "assetId-1" }).blur({ radius: 80 }).scale({ height: 100, width: 100 });
  const d = xelp2.process(); // Submit the job to the server
  //Example 2
  const xelp = new Xelp({ apiKey: "test_api_key" });

  // first blur v1
  const v1 = xelp.input({ id: "assetId-1" }).blur({ radius: 80 });
  // then scale v2
  const v2 = xelp.input({ id: "assetId-2" }).scale({ height: 100, width: 100 });
  // no operation on v3, just pass it through
  const v3 = xelp.input({ id: "assetId-3" });

  // merge v1 and v2 and then blur and scale resultant video
  const mergedV1V2 = xelp.concat(v1, v2).blur({ radius: 80 }).scale({ height: 100, width: 100 });

  // merge v1, v2 and v3
  const splitscreenAllVideos = xelp.splitscreen(v1, v2, v3);

  // concat mergedV1V2 and splitscreenAllVideos
  xelp.concat(mergedV1V2, splitscreenAllVideos);

  const data = await xelp.process(); // Submit the job to the server
  console.log(`here`, JSON.stringify(data, null, 2));
})();
