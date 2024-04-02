import { Lamar } from "../lib";
// Example 2
const lamar = new Lamar({ apiKey: "67hjugt6hg799hjbasd666snjklbvaklduasud77" });

(async () => {
  // Example 2 - Scale and then trim a video
  const video1 = lamar
    .input({ assetId: "cidnkkkaswhjas" })
    .scale({ width: 100, height: 100 })
    .trim({ start: 0, end: 10 });

  const job = await lamar.process({
    output: "mp4",
  });
  const data = lamar.subscribe(job.id, (data) => {
    console.log(data);
  });

  console.log(data);
})();
