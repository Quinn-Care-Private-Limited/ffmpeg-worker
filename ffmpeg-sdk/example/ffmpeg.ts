import { Ffmpeg, Files } from "../lib";

async function main() {
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

  // const chunks = await ffmpeg.segment("source/asset3/original.mp4", "output/asset3/chunks", 4);
  // const chunk = chunks[0];

  // const chunkProcessPath = `output/asset3/tmp/chunk_${chunk.chunknumber}_720_1000.mp4`;
  // await ffmpeg.twoPassEncode(chunk.chunkPath, chunkProcessPath, 720, "1000k");

  // await ffmpeg.segment("source/asset4/original.mp4", "output/asset4/tmp", 4);
  // await ffmpeg.concat(
  //   ["output/asset4/tmp/segment_0.mp4", "output/asset4/tmp/segment_1.mp4"],
  //   "output/asset4/chunks/chunk_0.mp4",
  // );

  // await ffmpeg
  //   .process()
  //   .input("source/ztjn5cak7rqbcnr3j8xcwwv1/original.mp4")
  //   .videoCodec("libx264")
  //   .crf(30)
  //   .output("output/test_20.mp4")
  //   .run();

  // await ffmpeg.segment("source/test.mp4", "output/test/segments", 4);

  const currentTimeStamp = Date.now();

  // await ffmpeg
  //   .process()
  //   .input("output/test/segments/segment_11.mp4")
  //   .crf(20)
  //   .output(`output/test/tmp/segment_11.mp4`)
  //   .run();

  await ffmpeg
    .process()
    .input("source/test.mp4")
    .seekStart(44)
    .seekEnd(48)
    .crf(20)
    .output(`output/test/tmp/segment_11.mp4`)
    .run();

  console.log("Time taken: ", (Date.now() - currentTimeStamp) / 1000);
}

main();
