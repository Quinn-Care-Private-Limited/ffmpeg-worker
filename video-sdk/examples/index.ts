import { CanvasObject } from "../lib/canvas/canvas-object";
import { Lamar } from "../lib/lamar";
(async () => {
  try {
    const circle = new CanvasObject({
      type: "circle",
      radius: 50,
      position: { x: 100, y: 100 },
      fill: "red",
      opacity: 1,
    });

    circle.animate({
      type: "move",
      delay: 0,
      duration: 4,
      moveToX: 500,
      moveToY: 600,
    });

    const text = new CanvasObject({
      type: "text",
      text: "Hello world",
      position: { x: 100, y: 100 },
      fontSize: 40,
      fill: "red",
    }).animate({
      type: "move",
      delay: 0,
      duration: 4,
      moveToX: 500,
      moveToY: 600,
    });

    const lamar = new Lamar({ apiKey: "a" });
    const video1 = lamar
      .input({ id: "clv51e55f000htopv1qo2yooj" })
      .addObject(circle, {
        start: 4,
        end: 8,
      })
      .addObject(text, {
        start: 8,
        end: 12,
      });

    // only alphanumeric characters are allowed
    const handle = Math.random().toString(36).substring(2, 7);
    console.log(handle);
    await lamar.process(video1, {
      output: "mp4",
      handle,
      name: "hello",
    });
  } catch (e) {
    console.error(e);
  }
})();
