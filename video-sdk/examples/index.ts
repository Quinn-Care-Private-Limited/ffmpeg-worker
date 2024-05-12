import { CanvasObject } from "../lib/canvas/canvas-object";
import { Lamar } from "../lib/lamar";
(async () => {
  try {
    const circle = new CanvasObject({
      type: "circle",
      radius: 100,
      position: { x: 100, y: 100 },
      fill: "red",
      opacity: 1,
    });

    circle.animate({ type: "fade", startOpacity: 0, endOpacity: 1, delay: 0, duration: 1 }).animate({
      type: "scale",
      endScale: 2.4,
      startScale: 1,
      delay: 0,
      duration: 1,
    });

    const square = new CanvasObject({
      type: "rectangle",
      position: { x: 100, y: 100 },
      height: 100,
      width: 100,
      fill: "red",
      opacity: 1,
    }).animate({ type: "rotate", startAngle: 0, endAngle: 360, delay: 0, duration: 1 });

    const text = new CanvasObject({
      type: "text",
      text: "Hello World",
      position: { x: 100, y: 100 },
      fontSize: 20,
    });
    const lamar = new Lamar({ apiKey: "test" });
    const video1 = lamar
      .input({ id: "$0" })
      .addObject(circle, {
        start: 0,
        end: 4,
      })
      .addObject(square, {
        start: 0,
        end: 1,
      })
      .trim({ start: 0, end: 4 })
      .addObject(text, {
        start: 0,
        end: 4,
      })
      .scale({ width: 1920, height: 1080 });

    await lamar.process(video1, { output: "mp4", handle: "t", name: "s" });
  } catch (e) {
    console.error(e);
  }
})();
