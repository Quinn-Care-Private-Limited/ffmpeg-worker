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

  // const { score } = await ffmpeg.getRelativeScore({ originalFile: chunk.chunkPath, compareFile: chunkProcessPath });
  // console.log(score);
  await ffmpeg.concat(
    ["output/asset3/tmp/chunk_14.mp4", "output/asset3/tmp/chunk_15.mp4"],
    "output/asset3/chunks/chunk_14.mp4",
  );
}

main();
