import { Ffmpeg, Files, IClientCredentials, Storage } from "../lib";

const client: IClientCredentials = {
  clientId: "QUINNCLIENTID",
  clientSecret: "QUINNCLIENTSECRET",
  clientServerUrl: "https://worker.quinn.live/api",
  // clientServerUrl: "http://localhost:4000/api",
};

async function main() {
  const currentTimeStamp = Date.now();
  const ffmpeg = new Ffmpeg(client);
  const files = new Files(client);
  const storage = new Storage(client);

  await storage.scheduleDownload({
    bucket: "xelp-source",
    key: "clqy6726w0007tovs4ewgvwom/clqy6726x0008tovs1qu6vnk1/c3ucdd3ttosbvc12jlgri4n1p/c3ucdd3ttosbvc12jlgri4n1p.mp4",
    path: "source/test/original1.mp4",
    multipart: true,
    callbackUrl: "https://razbotics.ngrok.io/test",
    callbackId: "test",
  });
  // await files.create("test.txt", "Hello World");

  return;

  const info = await files.list("source");
  console.log(info);

  const chunkPath = "source/test/original.mp4";
  const chunkProcessPath = `output/test/tmp/original_2000.mp4`;
  await ffmpeg.twoPassEncode(chunkPath, chunkProcessPath, 1440, "2000k");

  return;

  const chunks = await ffmpeg.segment(
    "source/tirf56pdoq3ox6w1zolszr8v/original.mp4",
    "output/asset1/chunks",
    "chunk",
    4,
  );
  const chunk = chunks[0];

  // const chunkProcessPath = `output/asset3/tmp/chunk_${chunk.chunknumber}_1080_3484.mp4`;
  // await ffmpeg.twoPassEncode(chunk.chunkPath, chunkProcessPath, 1080, "3484k");

  // const chunkProcessPath = `output/asset1/tmp/chunk_${chunk.chunknumber}_20.mp4`;
  // await ffmpeg.process().input(chunk.chunkPath).videoCodec("libx264").crf(20).output(chunkProcessPath).run();

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
