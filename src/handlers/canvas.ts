import path from "path";
import puppeteer from "puppeteer";
import { IHandlerResponse } from "types";
import fs from "fs";
import { z } from "zod";
import { createServer } from "http";
import { runcmd, runProcess } from "utils";
import { spawn } from "child_process";
import { Readable } from "stream";

let window: any;
let fileServerStarted = false;
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
const id = generateRandomNumberId();

const fileServer = createServer((req: any, res: any) => {
  if (req.url == "/.well-known/appspecific/com.chrome.devtools.json") {
    res.writeHead(204, { "Content-Type": "text/html" });
    res.end();
    return;
  }

  const filePath = `${fsPath}${req.url.replace(host, "")}`;
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
      fileServerStarted = true;
      console.log("File server started");
    });
  });

const closeServer = () =>
  new Promise((resolve, reject) => {
    fileServer.close(() => {
      resolve(true);
    });
  });

listenServer();

export const processHandler = async (body: z.infer<typeof processSchema>): Promise<IHandlerResponse> => {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-web-security",
      "--disable-features=IsolateOrigins,site-per-process",
      "--enable-gpu",
      "--use-gl=desktop",
    ],
    protocolTimeout: 6000_000,
    timeout: 0,
  });

  try {
    let retries = 0;
    while (!fileServerStarted) {
      if (retries == 10) {
        throw new Error("File server failed to start");
      }
      await new Promise((resolve) => {
        setTimeout(() => resolve(false), 500);
      });
      retries++;
    }

    //check if bundle exists in dir if not download bucket url
    if (!fs.existsSync(`${fsPath}/index.html`)) {
      await runcmd(
        `wget -O ${fsPath}/index.html "https://storage.googleapis.com/lamar-infra-assets/index.html?v=${Date.now()}"`,
      );
    }

    if (!fs.existsSync(`${fsPath}/bundle.min.js`)) {
      await runcmd(
        `wget -O ${fsPath}/bundle.min.js "https://storage.googleapis.com/lamar-infra-assets/bundle.min.js?v=${Date.now()}"`,
      );
    }

    const json = body.json as any;
    for (let i = 0; i < json.nodes.length; i++) {
      const config = json.nodes[i].config as { src: string };
      if (!(config.src.startsWith("https://") || config.src.startsWith("http://"))) {
        json.nodes[i].config.src = `${host}/${json.nodes[i].config.src}`;
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

    // Set page timeout
    page.setDefaultNavigationTimeout(0);
    page.setDefaultTimeout(0);

    // Enable request interception for better performance
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      if (
        request.resourceType() === "image" ||
        request.resourceType() === "stylesheet" ||
        request.resourceType() === "font"
      ) {
        request.abort();
      } else {
        request.continue();
      }
    });

    await page.goto(`${host}/index.html`);
    await page.addScriptTag({ url: `${host}/bundle.min.js` });

    // Wait for the render function to be available
    await page.waitForFunction(() => window.processCanvas);

    // Create output directory if it doesn't exist
    const outputDir = path.dirname(`${fsPath}/${body.output}`);
    if (!fs.existsSync(outputDir)) {
      await fs.promises.mkdir(outputDir, { recursive: true });
    }

    const fps = body.fps || 15;
    const totalDuration = body.endTime - body.startTime;
    const totalFrames = Math.ceil(totalDuration * fps);

    console.log(`${id} - Starting optimized frame capture`);
    console.log(`${id} - CPU cores: ${require("os").cpus().length}`);
    const memUsage = process.memoryUsage();
    console.log(
      `${id} - Memory usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB heap, ${Math.round(
        memUsage.rss / 1024 / 1024,
      )}MB RSS`,
    );
    console.log(`${id} - Processing ${totalDuration} seconds at ${fps} fps (${totalFrames} frames)`);

    await page.evaluate((json) => window.initCanvas(json), json);

    await page.waitForFunction(
      () => {
        return new Promise((resolve) => {
          if (window.canvas) {
            resolve(true);
          } else {
            setTimeout(() => resolve(false), 100);
          }
        });
      },
      { timeout: 10000 },
    );

    // Ensure canvas is properly initialized and seek to start time
    console.log(`${id} - Initializing canvas and seeking to start time: ${body.startTime}s`);
    await page.evaluate(async (startTime: number) => {
      if (!(window as any).canvas) {
        throw new Error("Canvas not initialized");
      }

      // Initial seek to start time
      await (window as any).canvas.seek(startTime);

      // Wait for initial render
      await new Promise((resolve) => setTimeout(resolve, 100));

      console.log("Canvas initialized and ready for frame capture");
    }, body.startTime);

    // Use batch processing approach instead of streaming
    console.log(`${id} - Starting batch frame processing`);
    const startTime = Date.now();
    await batchProcessFrames(page, body, json, fps, totalFrames);

    console.log(`${id} - Video creation completed in ${(Date.now() - startTime) / 1000}s`);

    await browser.close();

    return {
      status: 200,
      data: {
        output: "Video processing completed",
      },
    };
  } catch (error) {
    console.log(`${id} - Error processing canvas`);
    console.log(error);
    await browser.close();
    return {
      status: 400,
      data: {
        error: "Error processing canvas",
      },
    };
  }
};

async function batchProcessFrames(page: any, body: any, json: any, fps: number, totalFrames: number) {
  const batchSize = 60; // Process 60 frames at a time
  const totalDuration = body.endTime - body.startTime;

  // Create output directory if it doesn't exist
  const outputDir = path.dirname(`${fsPath}/${body.output}`);
  if (!fs.existsSync(outputDir)) {
    await fs.promises.mkdir(outputDir, { recursive: true });
  }

  const tempFramesDir = `${outputDir}/temp_frames_${id}`;
  if (!fs.existsSync(tempFramesDir)) {
    await fs.promises.mkdir(tempFramesDir, { recursive: true });
  }

  try {
    console.log(`${id} - Processing ${totalFrames} frames in batches of ${batchSize}`);

    let frameIndex = 0;
    for (let batchStart = 0; batchStart < totalFrames; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize, totalFrames);
      const batchFrameCount = batchEnd - batchStart;

      const batchStartTime = body.startTime + batchStart / fps;
      const batchEndTime = body.startTime + batchEnd / fps;

      console.log(
        `${id} - Processing batch ${Math.floor(batchStart / batchSize) + 1}/${Math.ceil(
          totalFrames / batchSize,
        )}: frames ${batchStart}-${batchEnd - 1} (${batchStartTime.toFixed(2)}s-${batchEndTime.toFixed(2)}s)`,
      );

      // Use the existing processCanvas function
      const frames = await page.evaluate(
        async (startTime: number, endTime: number, fps: number) => {
          return await (window as any).processCanvas(startTime, endTime, fps);
        },
        batchStartTime,
        batchEndTime,
        fps,
      );

      // Save frames to temporary files
      for (let i = 0; i < frames.length; i++) {
        const frameFilename = `${tempFramesDir}/frame_${String(frameIndex).padStart(6, "0")}.jpg`;
        const base64Data = frames[i].replace(/^data:image\/[a-z]+;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, "base64");
        await fs.promises.writeFile(frameFilename, imageBuffer);
        frameIndex++;
      }

      console.log(`${id} - Batch completed: ${frames.length} frames saved`);
    }

    // Create video from frames using ffmpeg
    console.log(`${id} - Creating video from ${frameIndex} frames`);
    const ffmpegCmd = [
      "-framerate",
      fps.toString(),
      "-i",
      `${tempFramesDir}/frame_%06d.jpg`,
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-pix_fmt",
      "yuv420p",
      "-crf",
      "16",
      "-y",
      `${fsPath}/${body.output}`,
    ].join(" ");

    await runcmd(`ffmpeg ${ffmpegCmd}`);
    console.log(`${id} - Video creation completed`);

    // Cleanup temp frames
    await runcmd(`rm -rf ${tempFramesDir}`);
    console.log(`${id} - Temporary frames cleaned up`);
  } catch (error) {
    // Cleanup on error
    if (fs.existsSync(tempFramesDir)) {
      await runcmd(`rm -rf ${tempFramesDir}`).catch(() => {});
    }
    throw error;
  }
}

function generateRandomNumberId(length = 3) {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
}
