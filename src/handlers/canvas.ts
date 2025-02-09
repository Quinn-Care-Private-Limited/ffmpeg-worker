import path from "path";
import puppeteer from "puppeteer";
import { IHandlerResponse } from "types";
import fs from "fs";
import { z } from "zod";
import { createServer } from "http";

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

const port = 8888;

const fileServer = createServer((req: any, res: any) => {
  const filePath = `${fsPath}/${req.url.replace(`http://localhost:${port}`, "")}`;
  fs.readFile(filePath, (err, data) => {
    const extension = path.extname(req.url).slice(1);
    const type = types[extension];
    if (err) {
      res.writeHead(404, { "Content-Type": "text/html" });
      res.end("404: File not found");
    } else {
      res.writeHead(200, { "Content-Type": type });
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
    headless: true, // Set to false to see what's happening
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    protocolTimeout: 6000_000,
    timeout: 0,
  });

  try {
    await listenServer();
    console.log("File server started");

    const json = body.json as any;
    for (let i = 0; i < json.nodes.length; i++) {
      json.nodes[i].config.src = `http://localhost:${port}/${json.nodes[i].config.src}`;
    }

    const page = await browser.newPage();

    // Enable console log from the browser
    page.on("console", (msg) => console.log("Browser log:", msg.text()));

    await page.setViewport({
      width: json.dimensions.width,
      height: json.dimensions.height,
      deviceScaleFactor: 1,
    });

    await page.goto(`http://localhost:${port}/index.html`);

    // Load the app from the existing server
    await page.addScriptTag({ url: `http://localhost:${port}/bundle.min.js` });

    // Wait for the render function to be available
    await page.waitForFunction(() => window.processCanvas);

    // console.log(json);

    // Get the video buffer directly
    const frames = await page.evaluate(
      async (...props) => {
        const frames = await window.processCanvas(...props);
        return frames;
      },
      json,
      body.startTime,
      body.endTime,
      body.fps,
    );
    await browser.close();

    const dir = `${fsPath}/${body.output}`;
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(`${fsPath}/${body.output}`, { recursive: true });
    }

    for (let i = 0; i < frames.length; i++) {
      const base64Data = frames[i].replace(/^data:image\/png;base64,/, "");
      const path = `${fsPath}/${body.output}/frame_${i.toString().padStart(3, "0")}.png`;
      await fs.promises.writeFile(path, base64Data, "base64");
    }

    await closeServer();
    console.log("File server closed");

    return {
      status: 200,
      data: {},
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
