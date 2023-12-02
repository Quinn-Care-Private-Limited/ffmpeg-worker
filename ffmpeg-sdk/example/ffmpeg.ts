import { Ffmpeg } from "../lib";

async function main() {
  const ffmpeg = new Ffmpeg({
    clientId: "DEVCLIENTID",
    clientSecret: "DEVCLIENTSECRET",
    clientServerUrl: "http://localhost:3000/api",
  });

  const chunks = await ffmpeg.segment("source/asset3/original.mp4", "output/asset3/chunks", 4);
  const chunk = chunks[0];

  const chunkProcessPath = `output/asset3/tmp/chunk_${chunk.chunknumber}_720_1000.mp4`;
  await ffmpeg.twoPassEncode(chunk.chunkPath, chunkProcessPath, 720, "1000k");

  const { score } = await ffmpeg.getRelativeScore({ originalFile: chunk.chunkPath, compareFile: chunkProcessPath });
  console.log(score);
}

main();
