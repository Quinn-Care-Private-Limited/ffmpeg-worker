import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { Filter } from "../lib/types";
import { CanvasObjectAnimation, CanvasObjectProperties } from "../lib/canvas/types";
import { start } from "repl";
import { object } from "zod";
const filepath = path.join(__dirname, "../filters.json");
const data: Filter[] = JSON.parse(readFileSync(filepath, "utf-8"));

const objectOps = data.filter((d: any) => d.type === "object");

const groupedByInput = objectOps.reduce((acc, curr) => {
  if (!acc[curr.in[0]]) {
    acc[curr.in[0]] = [];
  }
  acc[curr.in[0]].push(curr);
  return acc;
}, {} as Record<string, Filter[]>);
const canvases: any[] = [];
Object.keys(groupedByInput).forEach((key) => {
  const videoObjects = groupedByInput[key];
  if (videoObjects.length == 1 && videoObjects[0].params.animations.length == 0) {
    canvases.push({
      start: videoObjects[0].params.timing.start,
      end: videoObjects[0].params.timing.end,
      objects: videoObjects,
      type: "image",
    });
  } else {
    const starts: number[] = [];
    const ends: number[] = [];
    videoObjects.forEach((item) => {
      starts.push(item.params.timing.start);
      ends.push(item.params.timing.end);
    });

    canvases.push({
      start: Math.min(...starts),
      end: Math.max(...ends),
      objects: videoObjects,
      type: "video",
    });
  }
});
writeFileSync(path.join(__dirname, "canvases.json"), JSON.stringify(canvases, null, 2));
