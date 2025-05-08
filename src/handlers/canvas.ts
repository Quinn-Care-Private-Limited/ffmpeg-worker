import path from "path";
import puppeteer from "puppeteer";
import { IHandlerResponse } from "types";
import fs from "fs";
import { z } from "zod";
import { createServer } from "http";
import { runcmd, runProcess } from "utils";

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
      "--enable-gpu-rasterization",
      "--enable-zero-copy",
      "--ignore-gpu-blocklist",
      "--enable-gpu-compositing",
      "--enable-native-gpu-memory-buffers",
      "--enable-unsafe-swiftshader",
      "--enable-webgl",
      "--enable-webgl2",
      "--use-gl=angle",
      "--enable-accelerated-2d-canvas",
      "--enable-accelerated-mjpeg-decode",
      "--enable-accelerated-video-decode",
      "--enable-features=VaapiVideoDecoder",
      "--disable-features=UseChromeOSDirectVideoDecoder",
      "--disable-gpu-vsync",
      "--disable-frame-rate-limit",
      "--disable-web-security",
      "--disable-features=IsolateOrigins,site-per-process",
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

    const fps = body.fps || 15;

    // For 4 second chunks at 30fps (typical case), optimize batch size
    // Use the full duration as a single batch for short durations, or split into 2 equal chunks otherwise
    const totalDuration = body.endTime - body.startTime;
    const secondsPerBatch = totalDuration <= 1 ? totalDuration : 1;

    let start = body.startTime;
    let end = Math.min(start + secondsPerBatch, body.endTime);
    let totalFrames = 0;

    // console.log(json);

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

    // await page.evaluate((json) => window.canvas.fromJson(json), json);

    //sleep for a second to allow the app to load
    // while (true) {
    //   await new Promise((resolve) => setTimeout(resolve, 1000));
    // }

    console.log(`${id} - Starting frame capture`);
    console.log(
      `${id} - Processing ${totalDuration} seconds of content at ${fps} fps (expected ${Math.ceil(
        totalDuration * fps,
      )} frames)`,
    );

    while (start < body.endTime) {
      console.log(`${id} - Processing batch: ${start}s to ${end}s`);
      const startTime = Date.now();

      const frames = await page.evaluate(
        (startTime, endTime, fps) => window.processCanvas(startTime, endTime, fps),
        start,
        end,
        fps,
      );

      console.log(`${id} - Captured ${frames.length} frames in ${(Date.now() - startTime) / 1000}s`);

      // Process frames in parallel batches of 6 to avoid memory issues
      for (let i = 0; i < frames.length; i += 6) {
        const batchPromises = [];
        for (let j = 0; j < 6 && i + j < frames.length; j++) {
          const frameNumber = i + j + totalFrames;
          // Adjust base64 prefix for JPEG
          const base64Data = frames[i + j].replace(/^data:image\/jpeg;base64,/, "");
          // Change file extension to .jpg
          const framePath = `${tempFramesDir}/frame_${frameNumber.toString().padStart(5, "0")}.jpg`;
          batchPromises.push(fs.promises.writeFile(framePath, base64Data, "base64"));
        }

        // Wait for this small batch to complete before moving to next
        await Promise.all(batchPromises);
      }
      console.log(`${id} - Wrote batch frames to efs: from ${start}s to ${end}s`);

      totalFrames += frames.length;
      start = end;
      end = Math.min(start + secondsPerBatch, body.endTime);
    }

    await browser.close();
    console.log(`${id} - Frame capture finished`, { frames: totalFrames });

    // Use ffmpeg to stitch frames into a video
    console.log(`${id} - Creating video from frames...`);
    console.log(
      `${id} - Using parameters: fps=${fps}, totalFrames=${totalFrames}, duration=${body.endTime - body.startTime}s`,
    );

    // If fps is 0 or not set properly, default to 30
    const safeFps = !fps || fps <= 0 ? 30 : fps;

    await runProcess({
      chainCmds: [
        `-framerate ${safeFps}`,
        // Update ffmpeg input to use .jpg
        `-i ${tempFramesDir.replace(`${fsPath}/`, "")}/frame_%05d.jpg`,
        `-vf scale=${json.dimensions.width}:${json.dimensions.height}:force_original_aspect_ratio=disable`,
        `-c:v libx264`,
        `-preset ultrafast`,
        `-pix_fmt yuv420p`,
        `-crf 16`,
      ],
      output: body.output,
    });

    console.log(`${id} - Video creation completed`);

    // Clean up temp frames
    try {
      await runcmd(`rm -rf ${tempFramesDir}`);
      console.log(`${id} - Temporary frames cleaned up`);
    } catch (cleanupError) {
      console.log(`${id} - Warning: Failed to clean up temporary frames:`, cleanupError);
    }

    return {
      status: 200,
      data: {
        output: "Video processing completed",
      },
    };
  } catch (error) {
    console.log(error);
    // await browser.close();
    return {
      status: 400,
      data: {
        error: "Error processing canvas",
      },
    };
  }
};

function generateRandomNumberId(length = 3) {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
}
