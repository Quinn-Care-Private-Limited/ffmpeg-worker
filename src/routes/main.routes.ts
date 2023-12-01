import express from "express";
import { ffmpegRoutes } from "./ffmpeg.routes";
import { filesRoutes } from "./files.routes";
import { storageRoutes } from "./storage.routes";

export const mainRoute = express.Router();

mainRoute.use(`/ffmpeg`, ffmpegRoutes);
mainRoute.use(`/files`, filesRoutes);
mainRoute.use(`/storage`, storageRoutes);
