import path from "path";
import puppeteer from "puppeteer";
import { IHandlerResponse } from "types";
import fs from "fs";
import { z } from "zod";
import { createServer } from "http";
import { runcmd, runProcess } from "utils";

let window: any;

const fsPath = process.env.FS_PATH || ".";

export const processSchema = z.object({
  json: z.object({}),
  startTime: z.number().min(0),
  endTime: z.number().min(0),
  fps: z.number().min(0).optional(),
  output: z.string(),
});

const types: Record<string, string> = {
  html: "text/html",
  js: "application/javascript",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  mp4: "video/mp4",
};

const port = 5500;
const host = `http://127.0.0.1:${port}`;

const fileServer = createServer((req: any, res: any) => {
  const filePath = `${fsPath}/${req.url.replace(host, "")}`;
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  const extension = path.extname(req.url).slice(1);
  const type = types[extension];

  if (range && type === "video/mp4") {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });

    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": type,
      "Access-Control-Allow-Origin": "*",
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/html" });
        res.end("404: File not found");
      } else {
        res.writeHead(200, {
          "Content-Type": type,
          "Content-Length": fileSize,
          "Accept-Ranges": "bytes",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(data);
      }
    });
  }
});

const listenServer = () =>
  new Promise((resolve, reject) => {
    fileServer.listen(port, () => {
      resolve(true);
    });
  });

const closeServer = () =>
  new Promise((resolve, reject) => {
    fileServer.close(() => {
      resolve(true);
    });
  });

export const processHandler = async (body: z.infer<typeof processSchema>): Promise<IHandlerResponse> => {
  const browser = await puppeteer.launch({
    headless: true, // Use headless mode for better performance
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    protocolTimeout: 6000_000,
    timeout: 0,
  });

  try {
    //check if bundle exists in dir if not download bucket url
    if (!fs.existsSync(`${fsPath}/index.html`)) {
      await runcmd(`wget -O ${fsPath}/index.html "https://storage.googleapis.com/lamar-infra-assets/index.html"`);
    }

    if (!fs.existsSync(`${fsPath}/bundle.min.js`)) {
      await runcmd(`wget -O ${fsPath}/bundle.min.js "https://storage.googleapis.com/lamar-infra-assets/bundle.min.js"`);
    }

    await listenServer();
    console.log("File server started");

    const json = body.json as any;
    for (let i = 0; i < json.nodes.length; i++) {
      const config = json.nodes[i].config as { src: string };
      if (!(config.src.startsWith("https://") || config.src.startsWith("http://"))) {
        json.nodes[i].config.src = `${host}/${json.nodes[i].config.src}`;
        // json.nodes[i].config.src = `https://f8f485567ad5.ngrok.app/${json.nodes[i].config.src}`;
        // json.nodes[i].config.src = "https://storage.googleapis.com/yume-artifacts/sources/source0.mp4";
      }
    }

    const page = await browser.newPage();

    // Enable console log from the browser
    if (process.env.NODE_ENV == "development") {
      page.on("console", (msg) => console.log("Browser log:", msg.text()));
    }

    await page.setViewport({
      width: json.dimensions.width,
      height: json.dimensions.height,
      deviceScaleFactor: 1,
    });

    await page.goto(`${host}/index.html`);
    // await page.goto(`https://storage.googleapis.com/lamar-infra-assets/index.html?v=123`);
    // await page.goto(`https://storage.googleapis.com/pixi-site/index.html?v=8778`);

    // Load the app from the existing server
    await page.addScriptTag({ url: `${host}/bundle.min.js` });
    // await page.addScriptTag({ url: `https://storage.googleapis.com/lamar-infra-assets/bundle.min.js?v=123` });

    // Wait for the render function to be available
    // await page.waitForFunction(() => window.canvas);
    await page.waitForFunction(() => window.processCanvas);

    // console.log(json);

    // Create temp directory for frames
    const tempFramesDir = `${fsPath}/tmp/frames_${Date.now()}`;
    await fs.promises.mkdir(tempFramesDir, { recursive: true });

    // Create output directory if it doesn't exist
    const outputDir = path.dirname(`${fsPath}/${body.output}`);
    if (!fs.existsSync(outputDir)) {
      await fs.promises.mkdir(outputDir, { recursive: true });
    }

    //batch the json start and end to every 10 frames
    //calculate seconds for 10 frames given fps

    const fps = body.fps || 30;

    // For 4 second chunks at 30fps (typical case), optimize batch size
    // Use the full duration as a single batch for short durations, or split into 2 equal chunks otherwise
    const totalDuration = body.endTime - body.startTime;
    const secondsPerBatch = totalDuration <= 4 ? totalDuration : totalDuration / 2;

    let start = body.startTime;
    let end = Math.min(start + secondsPerBatch, body.endTime);
    let totalFrames = 0;

    await page.evaluate((json) => window.initCanvas(json), json);
    // await page.evaluate((json) => window.canvas.fromJson(json), json);

    //sleep for a second to allow the app to load
    // while (true) {
    //   await new Promise((resolve) => setTimeout(resolve, 1000));
    // }

    console.log("Starting frame capture");
    console.log(
      `Processing ${totalDuration} seconds of content at ${fps} fps (expected ${Math.ceil(
        totalDuration * fps,
      )} frames)`,
    );

    while (start < body.endTime) {
      console.log(`Processing batch: ${start}s to ${end}s`);
      const startTime = Date.now();

      const frames = await page.evaluate(
        (startTime, endTime, fps) => window.processCanvas(startTime, endTime, fps),
        start,
        end,
        fps,
      );

      console.log(`Captured ${frames.length} frames in ${(Date.now() - startTime) / 1000}s`);

      // Process frames in parallel batches of 6 to avoid memory issues
      for (let i = 0; i < frames.length; i += 6) {
        const batchPromises = [];
        for (let j = 0; j < 6 && i + j < frames.length; j++) {
          const frameNumber = i + j + totalFrames;
          const base64Data = frames[i + j].replace(/^data:image\/png;base64,/, "");
          const framePath = `${tempFramesDir}/frame_${frameNumber.toString().padStart(5, "0")}.png`;
          batchPromises.push(fs.promises.writeFile(framePath, base64Data, "base64"));
        }

        // Wait for this small batch to complete before moving to next
        await Promise.all(batchPromises);
      }

      totalFrames += frames.length;
      start = end;
      end = Math.min(start + secondsPerBatch, body.endTime);
    }

    await browser.close();
    console.log("Frame capture finished", { frames: totalFrames });

    // Use ffmpeg to stitch frames into a video
    console.log("Creating video from frames...");
    console.log(`Using parameters: fps=${fps}, totalFrames=${totalFrames}, duration=${body.endTime - body.startTime}s`);

    // If fps is 0 or not set properly, default to 30
    const safeFps = !fps || fps <= 0 ? 30 : fps;

    await runProcess({
      chainCmds: [
        `-framerate ${safeFps}`,
        `-i ${tempFramesDir.replace(`${fsPath}/`, "")}/frame_%05d.png`,
        `-c:v libx264`,
        `-preset ultrafast`,
        `-pix_fmt yuv420p`,
        `-crf 16`,
      ],
      output: body.output,
    });

    console.log("Video creation completed");

    // Clean up temp frames
    try {
      await runcmd(`rm -rf ${tempFramesDir}`);
      console.log("Temporary frames cleaned up");
    } catch (cleanupError) {
      console.log("Warning: Failed to clean up temporary frames:", cleanupError);
    }

    await closeServer();
    console.log("File server closed");

    return {
      status: 200,
      data: {
        output: "Video processing completed",
      },
    };
  } catch (error) {
    console.log(error);
    // await browser.close();
    await closeServer();
    console.log("File server closed");
    return {
      status: 400,
      data: {
        error: "Error processing canvas",
      },
    };
  }
};
