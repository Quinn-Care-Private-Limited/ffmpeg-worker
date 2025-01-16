import express, { Request, Response } from "express";
import { validateRequest } from "middlewares/req-validator";
import {
  checkHandler,
  checkSchema,
  copyHandler,
  copySchema,
  createHandler,
  createSchema,
  deleteHandler,
  deleteSchema,
  downloadFileSchema,
  downloaFileHandler,
  infoHandler,
  infoSchema,
  listHandler,
  listSchema,
  pathHandler,
  readHandler,
  readSchema,
} from "handlers/files";

export const filesRoutes = express.Router();

filesRoutes.post(`/path`, async (req: Request, res: Response) => {
  const resp = await pathHandler();
  res.status(resp.status).json(resp.data);
});

filesRoutes.post(`/list`, validateRequest(listSchema), async (req: Request, res: Response) => {
  const resp = await listHandler(req.body);
  res.status(resp.status).json(resp.data);
});

filesRoutes.post(`/check`, validateRequest(checkSchema), async (req: Request, res: Response) => {
  const resp = await checkHandler(req.body);
  res.status(resp.status).json(resp.data);
});

filesRoutes.post(`/create`, validateRequest(createSchema), async (req: Request, res: Response) => {
  const resp = await createHandler(req.body);
  res.status(resp.status).json(resp.data);
});

filesRoutes.post(`/read`, validateRequest(readSchema), async (req: Request, res: Response) => {
  const resp = await readHandler(req.body);
  res.status(resp.status).json(resp.data);
});

filesRoutes.post(`/delete`, validateRequest(deleteSchema), async (req: Request, res: Response) => {
  const resp = await deleteHandler(req.body);
  res.status(resp.status).json(resp.data);
});

filesRoutes.post(`/info`, validateRequest(infoSchema), async (req: Request, res: Response) => {
  const resp = await infoHandler(req.body);
  res.status(resp.status).json(resp.data);
});

filesRoutes.post(`/copy`, validateRequest(copySchema), async (req: Request, res: Response) => {
  const resp = await copyHandler(req.body);
  res.status(resp.status).json(resp.data);
});

filesRoutes.post(`/download`, validateRequest(downloadFileSchema), async (req: Request, res: Response) => {
  const resp = await downloaFileHandler(req.body);
  res.status(resp.status).json(resp.data);
});
