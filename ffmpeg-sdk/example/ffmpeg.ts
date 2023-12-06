import { Ffmpeg, Files } from "../lib";

async function main() {
  const currentTimeStamp = Date.now();
  const ffmpeg = new Ffmpeg({
    clientId: "QUINNCLIENTID",
    clientSecret: "QUINNCLIENTSECRET",
    clientServerUrl: "http://localhost:4000/api",
  });

  const files = new Files({
    clientId: "QUINNCLIENTID",
    clientSecret: "QUINNCLIENTSECRET",
    clientServerUrl: "http://localhost:4000/api",
  });

  const chunks = await ffmpeg.segment(
    "source/tirf56pdoq3ox6w1zolszr8v/original.mp4",
    "output/asset1/chunks",
    "chunk",
    4,
  );
  const chunk = chunks[0];

  // const chunkProcessPath = `output/asset3/tmp/chunk_${chunk.chunknumber}_1080_3484.mp4`;
  // await ffmpeg.twoPassEncode(chunk.chunkPath, chunkProcessPath, 1080, "3484k");

  const chunkProcessPath = `output/asset1/tmp/chunk_${chunk.chunknumber}_20.mp4`;
  await ffmpeg.process().input(chunk.chunkPath).videoCodec("libx264").crf(20).output(chunkProcessPath).run();

  // await ffmpeg.segment("source/asset4/original.mp4", "output/asset4/tmp", 4);
  // await ffmpeg.concat(
  //   ["output/asset4/tmp/segment_0.mp4", "output/asset4/tmp/segment_1.mp4"],
  //   "output/asset4/chunks/chunk_0.mp4",
  // );

  const { score } = await ffmpeg.getRelativeScore({
    originalFile: chunk.chunkPath,
    compareFile: chunkProcessPath,
    scale: { width: 1080, height: 1920 },
  });

  console.log("Score: ", score);

  console.log("Time taken: ", (Date.now() - currentTimeStamp) / 1000);
}

main();
