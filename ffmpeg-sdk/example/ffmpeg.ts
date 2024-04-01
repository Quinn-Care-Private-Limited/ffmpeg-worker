import { Ffmpeg, Files, IClientCredentials, IFfProcess, Storage } from "../lib";
import { FFProcess } from "../lib/ffmpeg/FFProcess";

const client: IClientCredentials = {
  clientId: "QUINNCLIENTID",
  clientSecret: "QUINNCLIENTSECRET",
  // clientServerUrl: "https://worker.quinn.live/api",
  clientServerUrl: "http://localhost:4000/api",
};

const files = new Files(client, (payload) => {
  console.log(payload);
});

const ffmpeg = new Ffmpeg(client, (payload) => {
  console.log(payload);
});

async function main() {
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
  // const { data } = await files.info("source/ajnboelabuu0yrzyz2quwgg2/original.mp4");
  // console.log(data);
  // const { score } = await ffmpeg.vmaf().run({
  //   input1: "output/asset1/tmp/original_10.mp4",
  //   input2: "source/asset1/original1.mp4",
  //   scale: "scale=1920:1080",
  //   model: "vmaf_v0.6.1",
  // });
  // console.log(score);
  // const chunkPath = `output/asset1/segments/segment_69.mp4`;
  // await ffmpeg
  //   .process()
  //   .input("source/ajnboelabuu0yrzyz2quwgg2/original.mp4")
  //   .videoCodec("libx264")
  //   .crf(20)
  //   .output("test/x264.mp4")
  //   .run();
  // await ffmpeg
  //   .process()
  //   .input("source/ajnboelabuu0yrzyz2quwgg2/original.mp4")
  //   .videoCodec("libx265")
  //   .crf(20)
  //   .output("test/x265.mp4")
  //   .run();
  // return;
  // await ffmpeg
  //   .process()
  //   .mux(ffmpeg.process().input(original).copy())
  //   .mux(ffmpeg.process().input(original).copy())
  //   .splitscreen("hstack")
  //   .output("output/asset1/original_hstack.mp4")
  //   .run();

  const original = "source/asset1/original.mp4";
  const outputFile = "output/asset1/original_trim.mp4";

  const process = ffmpeg
    .process()
    .input([original])
    .filterGraph(
      ffmpeg
        .process()
        .streamIn("0:v", "0:a")
        .crop({ x: 0, y: 0, width: "iw", height: "ih/2" })
        .trim(0, 5)
        .atrim(0, 5)
        .streamOut("v0", "a0"),
    )
    .filterGraph(
      ffmpeg
        .process()
        .streamIn("0:v", "0:a")
        .crop({ x: 0, y: 0, width: "iw", height: "ih/2" })
        .trim(3, 8)
        .atrim(3, 8)
        .streamOut("v1", "a1"),
    )
    .filterGraph(ffmpeg.process().streamIn("0:v", "0:a").trim(3, 8).atrim(3, 8).streamOut("v2", "a2"))
    .filterGraph(ffmpeg.process().streamIn(["v0", "v1"], ["a0", "a1"]).vstack(2).amerge(2).streamOut("sv1", "sa1"))
    .filterGraph(
      ffmpeg.process().streamIn(["sv1", "v2"], ["sa1", "a2"]).concat(2).aconcat(2).streamOut("vout", "aout"),
    );

  // await ffmpeg
  //   .process()
  //   .init(process)
  //   .audioCodec("aac")
  //   .audioBitrate("128k")
  //   .videoCodec("libx264")
  //   .crf(20)
  //   .filterGraph(ffmpeg.process().streamIn("vout").resolution(1080).streamOut("vout"))
  //   .mux("vout", "aout")
  //   .output(outputFile)
  //   .run();

  await ffmpeg
    .process()
    .init(process)
    .mux()
    .audioCodec("aac")
    .audioBitrate("128k")
    .videoCodec("libx264")
    .videoBitrate("2000k")
    .output(outputFile)
    .run();

  // const logPath = outputFile.replace(".mp4", "");
  // await ffmpeg
  //   .process()
  //   .runProcesses([
  //     ffmpeg
  //       .process()
  //       .init(process)
  //       .mux("vout", "aout")
  //       .videoCodec("libx264")
  //       .audioBitrate("128k")
  //       .videoBitrate("2000k")
  //       .pass(1, logPath)
  //       .format("mp4")
  //       .output("/dev/null"),
  //     ffmpeg
  //       .process()
  //       .init(process)
  //       .mux("vout", "aout")
  //       .audioCodec("aac")
  //       .audioBitrate("128k")
  //       .videoCodec("libx264")
  //       .videoBitrate("2000k")
  //       .pass(2, logPath)
  //       .output(outputFile),
  //   ]);

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

main();
