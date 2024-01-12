import express from "express";
import responseTime from "response-time";
import { ffmpegRoutes } from "./ffmpeg.routes";
import { filesRoutes } from "./files.routes";
import { storageRoutes } from "./storage.routes";
import { authRequest } from "middlewares/auth";

export const mainRoute = express.Router();

mainRoute.use(
  responseTime({
    suffix: false,
    digits: 0,
  }),
);
mainRoute.use(`/ffmpeg`, authRequest(), ffmpegRoutes);
mainRoute.use(`/files`, authRequest(), filesRoutes);
mainRoute.use(`/storage`, authRequest(), storageRoutes);
