import Canvas from "../lib/canvas";
import { CanvasObject } from "../lib/canvas/canvas-object";
import { Lamar } from "../lib/lamar";
import { LamarUtils } from "../lib/util";
(async () => {
  try {
    const canvas = new Canvas({ width: 1080, height: 1920, duration: 12 });

    const ball = new CanvasObject({
      type: "circle",
      radius: 50,
      position: { x: 100, y: 100 },
      timestamp: 0,
      fill: "green",
    })
      .animate({ type: "move", startAt: 0, endAt: 3, moveToX: 980, moveToY: 100 })
      .animate({ type: "move", startAt: 3, endAt: 6, moveToX: 980, moveToY: 1820 })
      .animate({ type: "move", startAt: 6, endAt: 9, moveToX: 100, moveToY: 1820 })
      .animate({ type: "move", startAt: 9, endAt: 12, moveToX: 100, moveToY: 100 });

    // Add objects to the canvas
    canvas.addObject(ball);
    const lamar = new Lamar({ apiKey: "cb6131b07012980fd707f6e5ba1924" });
    const video = lamar.input({ id: "clv51e55f000htopv1qo2yooj" });
    const video2 = lamar.overlay({
      videos: [video, canvas],
      params: { x: 0, y: 0, start: 0, end: 10 },
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
