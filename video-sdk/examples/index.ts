import Canvas from "../lib/canvas";
import { CanvasObject } from "../lib/canvas/canvas-object";
import { Lamar } from "../lib/lamar";
import { LamarUtils } from "../lib/util";
(async () => {
  try {
    const canvas = new Canvas({ width: 1080, height: 1920, duration: 10 });

    const ball = new CanvasObject({
      type: "circle",
      radius: 50,
      position: { x: 100, y: 100 },
      timeline: { start: 0, end: 10 },
      fill: "green",
    })
      .animate({ type: "move", duration: 2, moveToX: 980, moveToY: 100, delay: 0 })
      .animate({ type: "move", duration: 2, moveToX: 980, moveToY: 1820, delay: 2 })
      .animate({ type: "move", duration: 2, moveToX: 100, moveToY: 1820, delay: 4 })
      .animate({ type: "scale", duration: 2, startScale: 1, endScale: 1.5, delay: 6 })
      .animate({ type: "fade", duration: 2, startOpacity: 1, endOpacity: 0.1, delay: 8 });

    // Add objects to the canvas
    canvas.addObject(ball);
    const lamar = new Lamar({ apiKey: "cb6131b07012980fd707f6e5ba1924" });
    const video = lamar.input({ id: "clv51e55f000htopv1qo2yooj" });
    const video2 = lamar.overlay({
      videos: [video, canvas],
      params: {
        x: 0,
        y: 0,
        start: 0,
        end: 10,
      },
    });
    const randomName = Math.random().toString(36).substring(3, 7);
    const data = await lamar.process(video2, {
      handle: randomName,
      name: randomName,
      output: "mp4",
    });
    console.log(data);
  } catch (e) {
    console.error(e);
  }
})();
