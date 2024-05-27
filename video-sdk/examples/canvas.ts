import { readFileSync } from "fs";
import { CanvasType } from "../lib/canvas/types";
import path from "path";
import { CustomCanvas } from "./newcanvas";
const filepath = path.join(__dirname, "../filters.json");
const canvasData: CanvasType[] = JSON.parse(readFileSync(filepath, "utf-8"));
(async () => {
  const d = new CustomCanvas({ data: canvasData[0], sourceId: "test", assetId: "test" });
  await d.render();
})();
