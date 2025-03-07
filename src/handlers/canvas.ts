import path from "path";
import puppeteer from "puppeteer";
import { IHandlerResponse } from "types";
import fs from "fs";
import { z } from "zod";
import { createServer } from "http";
import { runcmd } from "utils";

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
  fs.readFile(filePath, (err, data) => {
    const extension = path.extname(req.url).slice(1);
    const type = types[extension];
    if (err) {
      res.writeHead(404, { "Content-Type": "text/html" });
      res.end("404: File not found");
    } else {
      res.writeHead(200, { "Access-Control-Allow-Origin": "*", "Content-Type": type });
      res.end(data);
    }
  });
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
    headless: false, // Set to false to see what's happening
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
    page.on("console", (msg) => console.log("Browser log:", msg.text()));

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

    const dir = `${fsPath}/${body.output}`;
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(`${fsPath}/${body.output}`, { recursive: true });
    }

    //batch the json start and end to every 10 frames
    //calculate seconds for 10 frames given fps

    const fps = body.fps || 30;
    const secondsPerBatch = 5 / (body.fps || 30);
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

    while (start < body.endTime) {
      const frames = await page.evaluate(
        (startTime, endTime, fps) => window.processCanvas(startTime, endTime, fps),
        start,
        end,
        fps,
      );

      for (let i = 0; i < frames.length; i++) {
        const frameNumber = i + totalFrames;
        const base64Data = frames[i].replace(/^data:image\/png;base64,/, "");
        const path = `${fsPath}/${body.output}/frame_${frameNumber.toString().padStart(3, "0")}.png`;
        await fs.promises.writeFile(path, base64Data, "base64");
      }

      totalFrames += frames.length;
      start = end;
      end = Math.min(start + secondsPerBatch, body.endTime);
    }

    await browser.close();

    console.log("Frame capture finished", { frames: totalFrames });

    await closeServer();
    console.log("File server closed");

    return {
      status: 200,
      data: {
        output: "Process completed",
      },
    };
  } catch (error) {
    console.log(error);
    await browser.close();
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
