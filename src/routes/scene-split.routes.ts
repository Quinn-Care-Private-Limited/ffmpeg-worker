import express, { Request, Response } from "express";
import { validateRequest } from "middlewares/req-validator";
import { processHandler, sceneSplitSchema } from "handlers/scene-split";

export const sceneSplitRoutes = express.Router();

sceneSplitRoutes.post(
  `/process`,
  validateRequest(sceneSplitSchema),
  async (req: Request, res: Response) => {
    const resp = await processHandler(req.body);
    res.status(resp.status).json(resp.data);
  },
);
