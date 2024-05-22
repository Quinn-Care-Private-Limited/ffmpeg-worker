import Canvas from "../lib/canvas";
import { CanvasObject } from "../lib/canvas/canvas-object";
import { Lamar } from "../lib/lamar";
import { LamarUtils } from "../lib/util";
(async () => {
  try {
    const canvas = new Canvas({ height: 1080, width: 1920, duration: 5 });

    const circle = new CanvasObject({
      type: "circle",
      radius: 30,
      position: { x: 100, y: 100 },
      timeline: { start: 0, end: 3 },
      fill: "red",
    }).animate({ type: "move", duration: 5, moveToX: 500, moveToY: 500, delay: 0 });

    const text = new CanvasObject({
      type: "text",
      text: "Hello World",
      fontSize: 50,
      fill: "yellow",
      position: { x: 300, y: 100 },
      timeline: { start: 3, end: 5 },
    }).animate({ type: "move", duration: 5, moveToX: 800, moveToY: 500, delay: 0 });

    canvas.addObject(circle);

    canvas.addObject(text);

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
