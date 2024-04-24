import { Lamar } from "../lib";
// Example 2
const lamar = new Lamar({ apiKey: "7b61d080d7139f17e23663cfa57e6f" });

(async () => {
  // Example 2 - Scale and then trim a video
  const video1 = lamar.input({ id: "1" });
  const video2 = lamar.input({ id: "1" });
  const video3 = lamar.input({ id: "2" });
  const video4 = lamar.input({ id: "2" });

  const s1 = video1.trim({ start: 0, end: 40 });
  const s2 = video2.trim({ start: 40, end: 42 });
  const s3 = video3.trim({ start: 2, end: 66 });
  const s4 = video4.trim({ start: 0, end: 2 });

  const transition = lamar.transition(s2, s4);

  const final = lamar.concat(s1, transition, s3);

  lamar.process(final, { output: "mp4", encoding: {}, handle: "s", name: "s" });

  try {
  } catch (err) {
    console.log(`err`, err);
  }
})();
