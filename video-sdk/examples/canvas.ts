import { readFileSync, unlink, unlinkSync, writeFileSync } from "fs";
import { CanvasObjectAnimation, CanvasObjectType, CanvasType } from "../lib/canvas/types";
import path from "path";
import fs from "fs";
import { fabric } from "fabric";
const { exec } = require("child_process");
const filepath = path.join(__dirname, "../filters.json");
const canvasData: CanvasType[] = JSON.parse(readFileSync(filepath, "utf-8"));
console.log(canvasData);
(async () => {
  fs.rmSync(__dirname + "/frames", { recursive: true, force: true });
  fs.mkdirSync(__dirname + "/frames");
  const { objects, properties } = canvasData[0];
  const duration = properties.duration;
  const framesPerSecond = 10;
  const frameCount = duration * framesPerSecond;
  const canvas = new fabric.StaticCanvas(null, {
    width: properties.width,
    height: properties.height,
    backgroundColor: "transparent",
  });
  const canvasObjects: Record<number, fabric.Object> = {};
  let timelineSecond = 0;
  for (let canvasFrame = 0; canvasFrame <= frameCount; canvasFrame++) {
    for (let i = 0; i < objects.length; i++) {
      const object = objects[i] as {
        properties: CanvasObjectType;
        animations: CanvasObjectAnimation[];
      };
      const { properties } = object;
      const { timeline } = properties;
      if (timeline.start >= timelineSecond || timeline.end <= timelineSecond) {
        // remove object from canvas, if it exists
        if (canvasObjects[i]) {
          canvas.remove(canvasObjects[i]);
          delete canvasObjects[i];
        }
        continue;
      }
      if (!canvasObjects[i]) {
        if (properties.type == "circle") {
          const circle = new fabric.Circle({
            radius: properties.radius,
            fill: properties.fill,
            left: properties.position.x,
            top: properties.position.y,
            evented: false,
            type: "circle",
            opacity: properties.opacity || 1,
            data: { id: i, initialTop: properties.position.y, initialLeft: properties.position.x },
            centeredRotation: true,
            centeredScaling: true,
          });
          canvasObjects[i] = circle;
          canvas.add(circle);
        } else if (properties.type == "rectangle") {
          const rect = new fabric.Rect({
            width: properties.width,
            height: properties.height,
            fill: properties.fill,
            left: properties.position.x,
            top: properties.position.y,
            evented: false,
            type: "rect",
            opacity: properties.opacity || 1,
            data: { id: i, initialTop: properties.position.y, initialLeft: properties.position.x },
            centeredRotation: true,
            centeredScaling: true,
          });
          canvasObjects[i] = rect;
          canvas.add(rect);
        } else if (properties.type == "text") {
          const text = new fabric.Text(properties.text, {
            left: properties.position.x,
            top: properties.position.y,
            fontSize: properties.fontSize,
            fill: properties.fill,
            evented: false,
            type: "text",
            data: { id: i, initialTop: properties.position.y, initialLeft: properties.position.x },
          });
          canvasObjects[i] = text;
          canvas.add(text);
          console.log(`text added`);
        }
      }

      const fabricObject = canvasObjects[i];
      const animations = object.animations.filter((animation) => {
        const delay = animation.delay + timeline.start;
        return delay <= timelineSecond && delay + animation.duration >= timelineSecond;
      });
      // console.log(animations);
      //   console.log(`second: ${second} animations: ${animations.length}`);
      const props: fabric.IObjectOptions = {};
      if (animations.length == 0) {
        console.log(`no animations for object ${i}`);
      }
      for (let animation of animations) {
        const { delay, duration, type } = animation;
        const animationSecond = timelineSecond - timeline.start + delay;
        console.log(`animationSecond: ${animationSecond}`);
        const animationFrame = Math.floor(animationSecond * framesPerSecond);
        // console.log(`Frame: ${frame} Second: ${second} Delay: ${delay} Duration: ${duration} Type: ${type}`);
        if (type == "fade") {
          const { startOpacity, endOpacity } = animation;
          const diff = endOpacity! - startOpacity!;
          const frameCount = duration * framesPerSecond;

          const diffPerFrame = diff / frameCount;
          const opacity = startOpacity! + diffPerFrame * animationFrame;
          props.opacity = opacity;
        } else if (type == "scale") {
          const { startScale, endScale } = animation;
          /**
           * Increase scale according to the time and duration mathematically, duration is in miliseconds
           */
          const diff = endScale! - startScale!;
          const frameCount = duration * framesPerSecond;
          const diffPerFrame = diff / frameCount;
          const scale = startScale! + diffPerFrame * animationFrame;
          props.scaleX = scale;
          props.scaleY = scale;
        } else if (type == "move") {
          const { moveToX, moveToY } = animation;
          const { initialLeft, initialTop } = fabricObject.data;
          const frameCount = duration * framesPerSecond;
          if (moveToX !== null) {
            const diffX = moveToX! - initialLeft!;
            const diffPerFrameX = diffX / frameCount;
            const x = initialLeft! + diffPerFrameX * animationFrame;

            props.left = x;
          }
          if (moveToY !== null) {
            const diffY = moveToY! - initialTop!;
            const diffPerFrameY = diffY / frameCount;
            const y = initialTop! + diffPerFrameY * animationFrame;
            props.top = y;
          }
        } else if (type == "rotate") {
          const { startAngle, endAngle } = animation;
          const diff = endAngle! - startAngle!;
          const frameCount = duration * framesPerSecond;
          const diffPerFrame = diff / frameCount;
          const angle = startAngle! + diffPerFrame * animationFrame;
          props.angle = angle;
        }
        if (props.angle && props.left && props.top) {
        }
        props.centeredRotation = true;
        props.centeredScaling = true;
        props.originX = "center";
        props.originY = "center";
      }
      fabricObject.set(props);
    }

    const data = canvas.toDataURL();
    writeFileSync(
      path.join(__dirname, `frames/frame-${canvasFrame}.png`),
      data.replace(/^data:image\/png;base64,/, ""),
      "base64",
    );
    timelineSecond += 1 / framesPerSecond;
  }
  if (fs.existsSync(`output.mp4`)) fs.unlinkSync(`output.mp4`);
  const framePath = path.join(__dirname, "frames");
  console.log(`creating video`);
  const cmd = `ffmpeg -r ${framesPerSecond} -f image2 -s 1920x1080 -i ${framePath}/frame-%d.png -vcodec libx264   -pix_fmt yuv420p output.mp4`;
  await runCmd(cmd);
})();
async function runCmd(cmd: string) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error: any, stdout: any, stderr: any) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}
