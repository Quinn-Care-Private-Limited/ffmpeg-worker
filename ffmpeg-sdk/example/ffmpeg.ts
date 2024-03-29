import { Ffmpeg, Files, IClientCredentials, IFfProcess, Storage } from "../lib";
import { FFProcess } from "../lib/ffmpeg/FFProcess";

const client: IClientCredentials = {
  clientId: "QUINNCLIENTID",
  clientSecret: "QUINNCLIENTSECRET",
  // clientServerUrl: "https://worker.quinn.live/api",
  clientServerUrl: "http://localhost:4000/api",
};

const ffmpeg = new Ffmpeg(client, (payload) => {
  console.log(payload);
});

async function main() {
  const currentTimeStamp = Date.now();

  const files = new Files(client);
  // const storage = new Storage(client);

  // await ffmpeg
  //   .process()
  //   .input("wu4wfdyvco9hk5mdl03cfsdu/original.mp4")
  //   .screenShot(1)
  //   .quality(18)
  //   .cropAspectRatio("1:1")
  //   .resolution(360)
  //   .filter()
  //   .output("wu4wfdyvco9hk5mdl03cfsdu/test.jpg")
  //   .run();

  // await storage.scheduleDownload({
  //   bucket: "xelp-source",
  //   key: "clqy6726w0007tovs4ewgvwom/clqy6726x0008tovs1qu6vnk1/c3ucdd3ttosbvc12jlgri4n1p/c3ucdd3ttosbvc12jlgri4n1p.mp4",
  //   path: "source/test/original1.mp4",
  //   multipart: true,
  //   callbackUrl: "https://razbotics.ngrok.io/test",
  //   callbackId: "test",
  // });
  // await files.create("test.txt", "Hello World");

  // return;

  // const info = await files.list("source");
  // console.log(info);

  // await ffmpeg
  //   .process()
  //   .runProcesses([
  //     ffmpeg
  //       .process()
  //       .input("source/asset1/original.mp4")
  //       .videoCodec("libx264")
  //       .crf(20)
  //       .output("output/asset1/tmp/original_2000.mp4"),
  //     ffmpeg
  //       .process()
  //       .input("output/asset1/tmp/original_2000.mp4")
  //       .cropAspectRatio("4:3")
  //       .output("output/asset1/tmp/original_2000_4_3.mp4"),
  //   ]);

  // await ffmpeg
  //   .process()
  //   .input("source/asset1/original.mp4")
  //   .boxblur(10)
  //   .output("output/asset1/tmp/original_blur.mp4")
  //   .run();

  // await ffmpeg
  //   .process()
  //   .input("output/asset1/tmp/original_blur.mp4")
  //   .cropAspectRatio("4:3")
  //   .output("output/asset1/tmp/original_4:3.mp4")
  //   .run();

  // await ffmpeg
  //   .process()
  //   .input("source/asset1/original.mp4")
  //   .boxblur(10)
  //   .cropAspectRatio("4:3")
  //   .output("output/asset1/tmp/original_blur_sharp.mp4")
  //   .run();

  // const { responseTime } = await ffmpeg.twoPassEncode(chunkPath, chunkProcessPath, 1440, "2000k");

  // const { data: data1 } = await files.info("source/asset1/original1.mp4");
  // console.log({ data1 });

  // await ffmpeg.process().input("source/asset1/original1.mp4").crf(10).output("output/asset1/tmp/original_10.mp4").run();

  // const { data: data2 } = await files.info("output/asset1/tmp/original_10.mp4");
  // console.log({ data2 });

  // const { score } = await ffmpeg.vmaf().run({
  //   input1: "output/asset1/tmp/original_10.mp4",
  //   input2: "source/asset1/original1.mp4",
  //   scale: "scale=1920:1080",
  //   model: "vmaf_v0.6.1",
  // });
  // console.log(score);

  const original = "output/asset1/original.mp4";
  const chunkPath = `output/asset1/segments/segment_69.mp4`;

  // await ffmpeg.process().input(original).codec("copy").segment(4).output("output/asset1/segments/segment_%d.mp4").run();

  // return;

  // await ffmpeg
  //   .process()
  //   .mux(ffmpeg.process().input(original).copy())
  //   .mux(ffmpeg.process().input(original).copy())
  //   .splitscreen("hstack")
  //   .output("output/asset1/original_hstack.mp4")
  //   .run();

  // const process = ffmpeg
  //   .process()
  //   .filterGraph(
  //     ffmpeg
  //       .process()
  //       .input(original)
  //       .crop({ x: 0, y: 0, width: "iw", height: "ih/2" })
  //       .trim(0, 5)
  //       .atrim(0, 5)
  //       .streamIn("0:v", "0:a")
  //       .streamOut("v0", "a0"),
  //   )
  //   .filterGraph(
  //     ffmpeg
  //       .process()
  //       .crop({ x: 0, y: 0, width: "iw", height: "ih/2" })
  //       .trim(3, 8)
  //       .atrim(3, 8)
  //       .streamIn("0:v", "0:a")
  //       .streamOut("v1", "a1"),
  //   )
  //   .filterGraph(ffmpeg.process().vstack(2).amerge(2).streamIn(["v0", "v1"], ["a0", "a1"]).streamOut("sv1", "sa1"))
  //   .filterGraph(ffmpeg.process().concat(2).streamIn(["sv1", "sa1", "0:v", "0:a"]).streamOut(["vout", "aout"]))
  //   .mux("vout", "aout");

  // await encode(process, "output/asset1/original_trim.mp4", "2000k");

  // await ffmpeg
  //   .process()
  //   .seekStart(291.11)
  //   .seekDuration(6.89)
  //   .input(original)
  //   .videoCodec("libx264")
  //   .crf(25)
  //   .output(`output/asset1/test1.mp4`)
  //   .run();

  // await ffmpeg.process().input(chunkPath).videoCodec("libx264").crf(25).output(`output/asset1/test2.mp4`).run();
  // const chunk = chunks[0];

  // const chunkProcessPath = `output/asset3/tmp/chunk_${chunk.chunknumber}_1080_3484.mp4`;
  // await ffmpeg.twoPassEncode(chunk.chunkPath, chunkProcessPath, 1080, "3484k");

  // const chunkProcessPath = `output/asset1/tmp/chunk_${chunk.chunknumber}_20.mp4`;
  // await ffmpeg.process().input(chunk.chunkPath).videoCodec("libx264").crf(20).output(chunkProcessPath).run();

  // await ffmpeg.concat(
  //   ["output/asset4/tmp/segment_0.mp4", "output/asset4/tmp/segment_1.mp4"],
  //   "output/asset4/chunks/chunk_0.mp4",
  // );

  // const { score } = await ffmpeg.getRelativeScore({
  //   originalFile: chunk.chunkPath,
  //   compareFile: chunkProcessPath,
  //   scale: { width: 1080, height: 1920 },
  // });

  // console.log("Score: ", score);

  // console.log("Time taken: ", (Date.now() - currentTimeStamp) / 1000);
}

async function encode(
  process: FFProcess,
  outputFile: string,
  videoBitrate?: string,
  resoluion?: number,
  audioBitrate = "128k",
) {
  const logPath = outputFile.replace(".mp4", "");

  if (videoBitrate) {
    await ffmpeg
      .process()
      .runProcesses([
        ffmpeg
          .process()
          .init(process)
          .videoCodec("libx264")
          .videoBitrate(videoBitrate)
          .resolution(resoluion)
          .preset("slow")
          .pass(1, logPath)
          .muted(true)
          .format("mp4")
          .output("/dev/null"),
        ffmpeg
          .process()
          .init(process)
          .audioCodec("aac")
          .audioBitrate(audioBitrate)
          .videoCodec("libx264")
          .videoBitrate(videoBitrate)
          .resolution(resoluion)
          .preset("slow")
          .pass(2, logPath)
          .output(outputFile),
      ]);
  } else {
    await process.resolution(resoluion).output(outputFile).run();
  }
}

main();
