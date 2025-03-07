import express from "express";
import responseTime from "response-time";
import { ffmpegRoutes } from "./ffmpeg.routes";
import { filesRoutes } from "./files.routes";
import { storageRoutes } from "./storage.routes";
import { canvasRoutes } from "./canvas.routes";

export const mainRoute = express.Router();

mainRoute.use(
  responseTime({
    suffix: false,
    digits: 0,
  }),
);
mainRoute.use(`/ffmpeg`, ffmpegRoutes);
mainRoute.use(`/files`, filesRoutes);
mainRoute.use(`/storage`, storageRoutes);
mainRoute.use(`/canvas`, canvasRoutes);
