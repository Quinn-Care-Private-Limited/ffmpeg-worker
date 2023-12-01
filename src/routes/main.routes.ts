import express from "express";
import { ffmpegRoutes } from "./ffmpeg.routes";
import { filesRoutes } from "./files.routes";
import { storageRoutes } from "./storage.routes";
import { authRequest } from "middlewares/auth";

export const mainRoute = express.Router();

mainRoute.use(`/ffmpeg`, authRequest(), ffmpegRoutes);
mainRoute.use(`/files`, authRequest(), filesRoutes);
mainRoute.use(`/storage`, authRequest(), storageRoutes);
