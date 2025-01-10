import { z } from "zod";
import { runcmd } from "handlers/utils";

const ffmpegPath = process.env.FFMPEG_PATH || "";
const fsPath = process.env.FS_PATH || ".";

const listSchema = z.object({
  path: z.string().optional(),
});

const checkSchema = z.object({
  path: z.string(),
});

const createFileSchema = z.object({
  path: z.string(),
  data: z.string().optional(),
  encoding: z.string().optional(),
});

const readFileSchema = z.object({
  path: z.string(),
});

const deleteSchema = z.object({
  path: z.string(),
});

const infoSchema = z.object({
  input: z.string(),
});

const copySchema = z.object({
  input: z.string(),
  output: z.string(),
});

const downloadSchema = z.object({
  url: z.string(),
  output: z.string(),
});
