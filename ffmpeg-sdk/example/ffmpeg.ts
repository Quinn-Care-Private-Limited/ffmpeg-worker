import { Ffmpeg } from "../lib";

async function main() {
  const ffmpeg = new Ffmpeg({
    clientId: "QUINNCLIENTID",
    clientSecret: "QUINNCLIENTSECRET",
    clientServerUrl: "http://localhost:4000/api",
  });

  // const chunks = await ffmpeg.segment("source/asset3/original.mp4", "output/asset3/chunks", 4);
  // const chunk = chunks[0];

  // const chunkProcessPath = `output/asset3/tmp/chunk_${chunk.chunknumber}_720_1000.mp4`;
  // await ffmpeg.twoPassEncode(chunk.chunkPath, chunkProcessPath, 720, "1000k");

  const { score } = await ffmpeg.getRelativeScore({
    originalFile: "output/asset4/chunks/chunk_3.mp4",
    compareFile: "output/asset4/tmp/chunk_3_2160_0.mp4",
    scale: {
      width: 1920,
      height: 1080,
    },
  });
  console.log(score);

  // await ffmpeg.segment("source/asset4/original.mp4", "output/asset4/tmp", 4);
  // await ffmpeg.concat(
  //   ["output/asset4/tmp/segment_0.mp4", "output/asset4/tmp/segment_1.mp4"],
  //   "output/asset4/chunks/chunk_0.mp4",
  // );
}

main();
