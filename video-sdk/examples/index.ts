import { Xelp } from "../lib";

const xelp = new Xelp();

const v1 = xelp.input({ id: "assetId-1" }).scale({ height: 100, width: 100 }).blur({ radius: 80 });
const v2 = xelp.input({ id: "assetId-2" }).blur({ radius: 10 });
const v3 = xelp.input({ id: "assetId-3" }).sharp({ sharpness: 10 });
const v4 = xelp.input({ id: "assetId-4" });
