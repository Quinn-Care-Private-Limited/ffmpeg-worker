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

    // **NEW OPTIMIZED APPROACH**: Stream frames directly to ffmpeg
    const startTime = Date.now();
    await streamFramesToFFmpeg(page, body, json, fps, totalFrames);

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

async function streamFramesToFFmpeg(page: any, body: any, json: any, fps: number, totalFrames: number) {
  return new Promise((resolve, reject) => {
    const safeFps = !fps || fps <= 0 ? 30 : fps;

    // Start ffmpeg process with pipe input
    const ffmpeg = spawn(
      "ffmpeg",
      [
        "-f",
        "image2pipe",
        "-vcodec",
        "mjpeg",
        "-framerate",
        safeFps.toString(),
        "-i",
        "pipe:0",
        "-vf",
        `scale=${json.dimensions.width}:${json.dimensions.height}:force_original_aspect_ratio=disable`,
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
      ],
      {
        stdio: ["pipe", "pipe", "pipe"],
      },
    );

    let frameCount = 0;
    let completedFrames = 0;
    let startTime = Date.now();
    let lastLogTime = Date.now();
    let lastLogFrameCount = 0;

    ffmpeg.stderr.on("data", (data) => {
      if (process.env.NODE_ENV === "development") {
        console.log(`FFmpeg: ${data}`);
      }
    });

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        const totalTime = (Date.now() - startTime) / 1000;
        const avgFps = completedFrames / totalTime;
        console.log(`${id} - FFmpeg completed successfully`);
        console.log(
          `${id} - Final stats: ${completedFrames} frames in ${totalTime.toFixed(2)}s (avg ${avgFps.toFixed(2)} fps)`,
        );
        resolve(true);
      } else {
        console.log(`${id} - FFmpeg failed with code ${code}`);
        reject(new Error(`FFmpeg failed with code ${code}`));
      }
    });

    ffmpeg.on("error", (error) => {
      console.log(`${id} - FFmpeg error:`, error);
      reject(error);
    });

    // Optimized frame generation function
    const generateNextFrame = async () => {
      if (frameCount >= totalFrames) {
        ffmpeg.stdin.end();
        return;
      }

      const currentTime = body.startTime + frameCount / fps;

      try {
        // Update canvas to current time before screenshot
        await page.evaluate((time: number) => {
          (window as any).canvas.seek(time);
        }, currentTime);

        // Use canvas screenshot method directly instead of page screenshot
        const base64Screenshot = await page.evaluate(() => {
          return (window as any).canvas.screenshot({ format: "jpg", quality: 95 });
        });

        // Convert base64 to buffer for ffmpeg
        const base64Data = base64Screenshot.replace(/^data:image\/[a-z]+;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, "base64");

        // Write directly to ffmpeg stdin
        const writeSuccess = ffmpeg.stdin.write(imageBuffer);

        frameCount++;
        completedFrames++;

        // Log progress every 30 frames or every 5 seconds, whichever comes first
        const now = Date.now();
        const timeSinceLastLog = now - lastLogTime;

        if (completedFrames % 30 === 0 || timeSinceLastLog >= 5000) {
          const framesSinceLastLog = completedFrames - lastLogFrameCount;
          const captureFps = framesSinceLastLog / (timeSinceLastLog / 1000);
          const overallFps = completedFrames / ((now - startTime) / 1000);
          const remainingFrames = totalFrames - completedFrames;
          const estimatedTimeRemaining = remainingFrames / overallFps;

          console.log(
            `${id} - Progress: ${completedFrames}/${totalFrames} frames (${Math.round(
              (completedFrames / totalFrames) * 100,
            )}%)`,
          );
          console.log(
            `${id} - Capture rate: ${captureFps.toFixed(1)} fps (last ${(timeSinceLastLog / 1000).toFixed(
              1,
            )}s), overall: ${overallFps.toFixed(1)} fps`,
          );
          console.log(`${id} - ETA: ${estimatedTimeRemaining.toFixed(1)}s remaining`);

          lastLogTime = now;
          lastLogFrameCount = completedFrames;
        }

        // Handle backpressure
        if (!writeSuccess) {
          ffmpeg.stdin.once("drain", generateNextFrame);
        } else {
          // Use setImmediate to avoid blocking the event loop
          setImmediate(generateNextFrame);
        }
      } catch (error) {
        console.log(`${id} - Error generating frame ${frameCount}:`, error);
        ffmpeg.stdin.end();
        reject(error);
      }
    };

    // Start the frame generation
    generateNextFrame();
  });
}

function generateRandomNumberId(length = 3) {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
}
