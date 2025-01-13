import fs from "fs";
import { z } from "zod";
import { runcmd } from "utils";
import { IHandlerResponse } from "types";

const ffmpegPath = process.env.FFMPEG_PATH || "";
const fsPath = process.env.FS_PATH || ".";

export const pathHandler = async (): Promise<IHandlerResponse> => {
  return {
    status: 200,
    data: {
      path: fsPath,
    },
  };
};

export const listSchema = z.object({
  path: z.string().optional(),
});

export const listHandler = async (body: z.infer<typeof listSchema>): Promise<IHandlerResponse> => {
  try {
    const { path = "" } = body;
    const data = await fs.promises.readdir(`${fsPath}/${path}`);
    return {
      status: 200,
      data: { list: data },
    };
  } catch (error) {
    return {
      status: 400,
      data: {
        error: error.message,
      },
    };
  }
};

export const checkSchema = z.object({
  path: z.string(),
});

export const checkHandler = async (body: z.infer<typeof checkSchema>): Promise<IHandlerResponse> => {
  try {
    const { path } = body;
    const stat = await fs.promises.stat(`${fsPath}/${path}`);
    return {
      status: 200,
      data: {
        isExists: true,
        isDirectory: stat.isDirectory(),
      },
    };
  } catch (error) {
    return {
      status: 200,
      data: {
        isExists: false,
        isDirectory: false,
      },
    };
  }
};

export const createSchema = z.object({
  path: z.string(),
  data: z.string().optional(),
  encoding: z.string().optional(),
});

export const createHandler = async (body: z.infer<typeof createSchema>): Promise<IHandlerResponse> => {
  try {
    const { path, data } = body as z.infer<typeof createSchema>;
    const encoding = body.encoding || "utf-8";
    if (data) {
      const dirPath = `${fsPath}/${path.split("/").slice(0, -1).join("/")}`;
      const stat = await fs.promises.stat(`${fsPath}/${path}`).catch(() => false);

      if (!stat) {
        await fs.promises.mkdir(dirPath, { recursive: true });
      }
      await fs.promises.writeFile(`${fsPath}/${path}`, data, {
        encoding: encoding as BufferEncoding,
      });
    } else {
      await fs.promises.mkdir(`${fsPath}/${path}`, { recursive: true });
    }

    return {
      status: 200,
      data: {},
    };
  } catch (error) {
    return {
      status: 400,
      data: {
        error: error.message,
      },
    };
  }
};

export const readSchema = z.object({
  path: z.string(),
});

export const readHandler = async (body: z.infer<typeof readSchema>): Promise<IHandlerResponse> => {
  try {
    const { path } = body;
    const data = await fs.promises.readFile(`${fsPath}/${path}`, "utf-8");
    return {
      status: 200,
      data: { output: data },
    };
  } catch (error) {
    return {
      status: 400,
      data: {
        error: error.message,
      },
    };
  }
};

export const deleteSchema = z.object({
  path: z.string(),
});

export const deleteHandler = async (body: z.infer<typeof deleteSchema>): Promise<IHandlerResponse> => {
  try {
    const { path } = body;
    const stat = await fs.promises.stat(`${fsPath}/${path}`);
    if (stat.isDirectory()) {
      await fs.promises.rmdir(`${fsPath}/${path}`, { recursive: true });
    } else {
      await fs.promises.unlink(`${fsPath}/${path}`);
    }

    return {
      status: 200,
      data: {},
    };
  } catch (error) {
    return {
      status: 400,
      data: {
        error: error.message,
      },
    };
  }
};

export const infoSchema = z.object({
  input: z.string(),
});

export const infoHandler = async (body: z.infer<typeof infoSchema>): Promise<IHandlerResponse> => {
  try {
    const { input } = body as z.infer<typeof infoSchema>;
    let cmd = `${ffmpegPath}ffprobe`;

    const path = `${fsPath}/${input}`;
    const extension = path.split(".").pop();
    const stream = ["mp3", "wav", "flac", "m4a", "aac", "opus"].includes(extension!) ? "a:0" : "v:0";

    const infoCmd = `${cmd} -v error -select_streams ${stream} -show_entries stream=duration,width,height,bit_rate,r_frame_rate -of default=noprint_wrappers=1 ${path}`;
    const sizeCmd = `${cmd} -v error -select_streams ${stream} -show_entries format=size -of default=noprint_wrappers=1 ${path}`;
    const rotationCmd = `${cmd} -v error -select_streams ${stream} -show_entries stream_side_data=rotation -of default=noprint_wrappers=1 ${path}`;

    const [fileInfo, sizeData, rotationData] = await Promise.all([
      runcmd(infoCmd),
      runcmd(sizeCmd),
      runcmd(rotationCmd),
    ]);
    const data: any = {};
    const lines = `${fileInfo}${sizeData}${rotationData}`.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const [key, value] = line.split("=");
      if (key && value) {
        if (key === "bit_rate") {
          data.avgbitrate = Math.floor(+value / 1000);
        } else if (key === "r_frame_rate") {
          const [num, den] = value.split("/");
          data.framerate = Math.round(+num / +den);
        } else if (key === "size") {
          data.size = Math.floor(+value / 1024);
        } else {
          data[key] = +value;
        }
      }
    }

    if (data.rotation === 90 || data.rotation === -90) {
      const { width, height } = data;
      data.width = height;
      data.height = width;
    }

    return {
      status: 200,
      data,
    };
  } catch (error) {
    return {
      status: 400,
      data: {
        error: error.message,
      },
    };
  }
};

export const copySchema = z.object({
  input: z.string(),
  output: z.string(),
});

export const copyHandler = async (body: z.infer<typeof copySchema>): Promise<IHandlerResponse> => {
  try {
    const { input, output } = body as z.infer<typeof copySchema>;
    await fs.promises.copyFile(`${fsPath}/${input}`, `${fsPath}/${output}`);
    return {
      status: 200,
      data: {},
    };
  } catch (error) {
    return {
      status: 400,
      data: {
        error: error.message,
      },
    };
  }
};

export const downloadFileSchema = z.object({
  url: z.string(),
  output: z.string(),
});

export const downloaFileHandler = async (body: z.infer<typeof downloadFileSchema>): Promise<IHandlerResponse> => {
  try {
    const { url, output } = body as z.infer<typeof downloadFileSchema>;
    const dirPath = `${fsPath}/${output.split("/").slice(0, -1).join("/")}`;

    const isExists = await fs.promises.stat(dirPath).catch(() => false);
    if (!isExists) {
      await fs.promises.mkdir(dirPath, { recursive: true });
    }
    await runcmd(`wget -O ${fsPath}/${output} "${url}"`);
    return {
      status: 200,
      data: {},
    };
  } catch (error) {
    return {
      status: 400,
      data: {
        error: error.message,
      },
    };
  }
};
