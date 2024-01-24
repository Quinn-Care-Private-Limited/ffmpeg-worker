import { Xelp } from "../lib";

const xelp = new Xelp();

const v1 = xelp.input({ id: "assetId-1" }).blur({ radius: 80 });
const v2 = xelp.input({ id: "assetId-2" }).scale({ height: 100, width: 100 });
const v3 = xelp.input({ id: "assetId-3" });

const mergedV1V2 = xelp.concat(v1, v2).blur({ radius: 80 }).scale({ height: 100, width: 100 });

const splitscreenAllVideos = xelp.splitscreen(v1, v2, v3);

const data = xelp.concat(mergedV1V2, splitscreenAllVideos).process();

console.log(data);
