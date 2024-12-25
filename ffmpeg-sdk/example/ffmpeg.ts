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

  // await ffmpeg
  //   .process()
  //   .format("lavfi")
  //   .input("anullsrc=channel_layout=stereo:sample_rate=44100")
  //   .input(original)
  //   .flag("shortest")
  //   .videoCodec("copy")
  //   .audioCodec("aac")
  //   .output(original)
  //   .run();

  // const data = await ffmpeg
  //   .probe()
  //   .input("output/rb4wp92fpgt9b9tmrg4xighu/chunks/bq7j27b4pbydabow1qojrxcx.mp4")
  //   .showstreams("a")
  //   .verbose("error")
  //   .run();
  // console.log(data);
  // return;

  // await ffmpeg
  //   .process()
  //   .format("concat")
  //   .flag("safe", "0")
  //   .input("output/rb4wp92fpgt9b9tmrg4xighu/test.txt")
  //   .videoCodec("copy")
  //   .output(outputFile)
  //   .run();

  // return;

  // const process = ffmpeg
  //   .process()
  //   .input(["test/sources/source0.mp4", "test/sources/source3.png", "output/test/tmp/chunks/source4/chunk_0.mp3"])
  //   .filterGraph(ffmpeg.process().streamIn("0:v", "0:a").vcopy().acopy().streamOut("v0", "a0"))
  //   .filterGraph(ffmpeg.process().streamIn("1:v").opacity(0.3).streamOut("v1"))
  //   .filterGraph(
  //     ffmpeg
  //       .process()
  //       .streamIn(["v0", "v1"], ["a0"])
  //       .overlay({ x: 0, y: 0, start: 0, end: 3.25 })
  //       .acopy()
  //       .streamOut("vhstack", "ahstack"),
  //   )
  //   .filterGraph(ffmpeg.process().streamIn(null, "2:a").aloop({ count: -1, duration: 3 }).streamOut(null, "a2"))
  //   .filterGraph(ffmpeg.process().streamIn(null, ["ahstack", "a2"]).areplace().streamOut(null, "ahstack"))
  //   .mux();

  // const { path } = await files.path();

  // const process = ffmpeg
  //   .process()
  //   .input(["test/sources/source1.mp4"])
  // .filterGraph(
  //   ffmpeg.process().streamIn("0:v", "0:a").trim(0, 4).atrim(0, 4).settb("AVTB").asettb("AVTB").streamOut("v0", "a0"),
  // )
  // .filterGraph(
  //   ffmpeg.process().streamIn("1:v", "1:a").trim(0, 4).atrim(0, 4).settb("AVTB").asettb("AVTB").streamOut("v1", "a1"),
  // )
  // .filterGraph(
  //   ffmpeg
  //     .process()
  //     .streamIn(["v0", "v1"], ["a0", "a1"])
  //     .transition({ type: "fade", duration: 4 })
  //     .acrossfade(4 - 1)
  //     .atrim(0, 4)
  //     .streamOut("vout", "aout"),
  // )
  // .filterGraph(ffmpeg.process().vfilterCmd("color=black:d=4:s=720x1280:rate=30").settb("AVTB").streamOut("v0"))
  // .filterGraph(
  //   ffmpeg
  //     .process()
  //     .afilterCmd("anullsrc=channel_layout=stereo:d=4:sample_rate=44100")
  //     .asettb("AVTB")
  //     .streamOut(null, "a0"),
  // )
  // .filterGraph(
  //   ffmpeg.process().streamIn("0:v", "0:a").trim(0, 4).settb("AVTB").atrim(0, 4).asettb("AVTB").streamOut("v1", "a1"),
  // )
  // .filterGraph(
  //   ffmpeg
  //     .process()
  //     .streamIn(["v0", "v1"], ["a0", "a1"])
  //     .transition({ type: "slideright", duration: 4 })
  //     .acrossfade(4 - 0.1)
  //     .atrim(0, 4)
  //     .streamOut("vout", "aout"),
  // )
  // .mux();

  // await ffmpeg
  //   .process()
  //   .input(["test/IMG_2602.MOV"])
  //   .audioCodec("aac")
  //   .crf(18)
  //   .videoCodec("libx264")
  //   .output("test/output1.mp4")
  //   .run();

  const data = await files.info("test.mp4");
  console.log(data);

  // const process1 = ffmpeg
  //   .process()
  //   .input(["test/sources/source1.mp4", "test/sources/source2.mp4"])
  //   .filterGraph(ffmpeg.process().streamIn("0:v", "0:a").trim(2, 4).atrim(2, 4).streamOut("v0", "a0"))
  //   .filterGraph(ffmpeg.process().streamIn("1:v", "1:a").trim(2, 4).atrim(2, 4).streamOut("v1", "a1"))
  //   .filterGraph(
  //     ffmpeg
  //       .process()
  //       .streamIn(["v0", "v1"], ["a0", "a1"])
  //       .transition({ type: "fade", duration: 2, offset: 0 })
  //       .acrossFade(2)
  //       .streamOut("vout", "aout"),
  //   )
  //   .mux();

  // await ffmpeg.process().init(process1).flag("pix_fmt", "yuv420p").output("test/output2.mp4").run();

  // await concat(["test/output1.mp4", "test/output2.mp4"], "test/output.mp4");

  // await ffmpeg
  //   .process()
  //   .init(process)
  //   .audioCodec("aac")
  //   .audioBitrate("128k")
  //   .videoCodec("libx264")
  //   .videoBitrate("2000k")
  //   .output(outputFile)
  //   .run();

  // const logPath = outputFile.replace(".mp4", "");
  // await ffmpeg
  //   .process()
  //   .runProcesses([
  //     ffmpeg
  //       .process()
  //       .input("output/c4fbmviitjok2kabobot84ntj/tmp/chunks/clumy3yc8003lwhd8882shfr7/chunk_0.mp4")
  //       .videoCodec("libx264")
  //       .audioBitrate("128k")
  //       .videoBitrate("1250k")
  //       .scale({ width: 480, height: 852 })
  //       .filter()
  //       .pass(1, logPath)
  //       .format("mp4")
  //       .output(outputFile),
  //     ffmpeg
  //       .process()
  //       .input("output/c4fbmviitjok2kabobot84ntj/tmp/chunks/clumy3yc8003lwhd8882shfr7/chunk_0.mp4")
  //       .audioCodec("aac")
  //       .audioBitrate("128k")
  //       .videoCodec("libx264")
  //       .videoBitrate("1250k")
  //       .scale({ width: 480, height: 852 })
  //       .filter()
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

async function concat(inputFiles: string[], outputFile: string) {
  const { path } = await files.path();
  const extension = outputFile.split(".").pop();

  const concatFileContent = inputFiles.map((item) => `file '${path}/${item}'`).join("\n");
  const concatFilePath = outputFile.replace(`.${extension}`, ".txt");
  await files.create(concatFilePath, concatFileContent);

  await ffmpeg
    .process()
    .format("concat")
    .flag("safe", "0")
    .input(concatFilePath)
    .codec("copy")
    .output(outputFile)
    .run();
}

main();

// ffmpeg -y -i /Users/razbotics/projects/mediaprocessing/efs/test/original.mp4 -c:a aac -b:a 128k -c:v libx264 -b:v 1250k -vf \"scale=480:852,\" -preset slow -pass 1 -passlogfile test -f mp4 /dev/null
// console.log("Score: ", score);
