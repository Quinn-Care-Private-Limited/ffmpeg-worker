import { readFileSync, unlink, unlinkSync, writeFileSync } from "fs";
import path from "path";
import { Canvas } from "./types";
import fs from "fs";
import { fabric } from "fabric";
const { exec } = require("child_process");
const filepath = path.join(__dirname, "canvases.json");
const canvases: Canvas[] = JSON.parse(readFileSync(filepath, "utf-8"));

(async () => {
  fs.rmSync(__dirname + "/frames", { recursive: true, force: true });
  fs.mkdirSync(__dirname + "/frames");
  for (let canvasNumber = 0; canvasNumber < canvases.length; canvasNumber++) {
    const { objects, start, end } = canvases[canvasNumber];
    const duration = end - start;
    const framesPerSecond = 24;
    const frameCount = duration * framesPerSecond;
    const canvas = new fabric.StaticCanvas(null, { width: 1920, height: 1080, backgroundColor: "white" });
    const canvasObjects: Record<string, fabric.Object> = {};
    let text: fabric.Text | null = null;

    for (let canvasFrame = 0; canvasFrame <= frameCount; canvasFrame++) {
      const videoSecond = canvasFrame / framesPerSecond;
      for (let object of objects) {
        const { properties, timing } = object.params;
        if (timing.start > videoSecond || timing.end < videoSecond) {
          // remove object from canvas, if it exists
          if (canvasObjects[object.filterId]) {
            canvas.remove(canvasObjects[object.filterId]);
            continue;
          }
        }
        if (!canvasObjects[object.filterId]) {
          if (properties.type == "circle") {
            const circle = new fabric.Circle({
              radius: properties.radius,
              fill: properties.fill,
              left: properties.position.x,
              top: properties.position.y,
              evented: false,
              type: "circle",
              opacity: properties.opacity || 1,
              data: { id: object.filterId },
              centeredRotation: true,
              centeredScaling: true,
            });
            canvasObjects[object.filterId] = circle;
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
              data: { id: object.filterId, initialTop: properties.position.y, initialLeft: properties.position.x },
              centeredRotation: true,
              centeredScaling: true,
            });
            canvasObjects[object.filterId] = rect;
            canvas.add(rect);
          } else if (properties.type == "text") {
            const text = new fabric.Text(properties.text, {
              left: properties.position.x,
              top: properties.position.y,
              fontSize: properties.fontSize,
              fill: properties.fill,
              evented: false,
              type: "text",
              data: { id: object.filterId },
            });
            canvasObjects[object.filterId] = text;
            canvas.add(text);
          }
        }

        const fabricObject = canvasObjects[object.filterId];
        const animations = object.params.animations.filter((animation) => {
          return animation.delay <= videoSecond && animation.delay + animation.duration >= videoSecond;
        });
        // console.log(animations);
        //   console.log(`second: ${second} animations: ${animations.length}`);
        const props: fabric.IObjectOptions = {};

        for (let animation of animations) {
          const { delay, duration, type } = animation;
          const animationSecond = videoSecond - delay;
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
        path.join(__dirname, `frames/frame-${canvasNumber}-${canvasFrame}.png`),
        data.replace(/^data:image\/png;base64,/, ""),
        "base64",
      );
    }
    if (fs.existsSync(`output-${canvasNumber}.mp4`)) fs.unlinkSync(`output-${canvasNumber}.mp4`);
    const framePath = path.join(__dirname, "frames");
    console.log(`creating video`);
    const cmd = `ffmpeg -r ${framesPerSecond} -f image2 -s 1920x1080 -i ${framePath}/frame-${canvasNumber}-%d.png -vcodec libx264   -pix_fmt yuv420p output-${canvasNumber}.mp4`;
    await runCmd(cmd);
  }
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
