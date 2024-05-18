import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { Filter } from "../lib/types";

const filepath = path.join(__dirname, "../filters.json");
const updated = path.join(__dirname, "../update.json");

const data: Filter[] = JSON.parse(readFileSync(filepath, "utf-8"));
const objectFilters: Filter[] = data.filter((i) => i.type == "object");
type Canvas = {
  objects: Filter[];
  referenceSource?: string;
  start?: number;
  end?: number;
  type?: "image" | "video";
};
const canvases: Canvas[] = [];

/**
 * If type is object, and out of one object is in of another object then group them together, both in and out are array of strings
 */
objectFilters.forEach((filter) => {
  const in_ = filter.in[0];
  const found = canvases.find((group) => group.objects.some((f) => f.out.includes(in_)));
  if (found) {
    found.objects.push(filter);
  } else {
    // random Alphanumeric id
    canvases.push({ objects: [filter] });
  }
});

canvases.forEach((canvas, index) => {
  const { objects } = canvas;
  const canvasInput = objects[0].in[0];
  if (canvasInput.startsWith("$")) {
    canvas.referenceSource = canvasInput;
  } else {
    const originalSource = findOriginalSourceRecursively(canvasInput, data);
    if (originalSource) {
      canvas.referenceSource = originalSource;
    }
  }

  if (objects.length == 1 && objects[0].params.animations.length == 0) {
    canvas.type = "image";
    canvas.start = objects[0].params.timing.start;
    canvas.end = objects[0].params.timing.end;
  } else {
    canvas.type = "video";
    const starts: number[] = [];
    const ends: number[] = [];
    objects.forEach((item) => {
      const params = item.params;
      starts.push(params.timing.start);
      ends.push(params.timing.end);
    });
    canvas.start = Math.min(...starts);
    canvas.end = Math.max(...ends);
  }
});

canvases.forEach((canvas, index) => {
  const { objects } = canvas;
  const canvasInput = objects[0].in[0];
  const canvasOutput = objects[objects.length - 1].out[0];
  const canvasSource = `$${canvases.length + index}`;
  const randomId = Math.random().toString(36).substring(7);
  data.push({
    type: "overlay",
    in: [canvasInput, canvasSource],
    params: {},
    filterId: "",
    out: [randomId],
  });

  data.forEach((filter) => {
    if (filter.in.includes(canvasOutput)) {
      filter.in[filter.in.indexOf(canvasOutput)] = randomId;
    }
  });
});

// find reference for each canvas

function findOriginalSourceRecursively(input: string, data: Filter[]): string | null {
  // console.log(`looking for ${input}`);
  // keep looking for the original source (it starts with $)
  const filter = data.find((f) => f.out.includes(input));
  if (filter) {
    if (filter.in[0].startsWith("$")) {
      return filter.in[0];
    } else {
      return findOriginalSourceRecursively(filter.in[0], data);
    }
  } else {
    return null;
  }
}

writeFileSync(
  updated,
  JSON.stringify(
    {
      filters: data.filter((i) => i.type != "object"),
      canvases,
    },
    null,
    2,
  ),
);
