import express, { Request, Response } from "express";
import { validateRequest } from "middlewares/req-validator";
import { processHandler, processSchema } from "handlers/canvas";

export const canvasRoutes = express.Router();

canvasRoutes.post(`/process`, validateRequest(processSchema), async (req: Request, res: Response) => {
  const resp = await processHandler(req.body);
  res.status(resp.status).json(resp.data);
});
