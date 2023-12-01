import express from "express";

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

export const authRequest = () => async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.headers["x-client-id"] === clientId && req.headers["x-client-secret"] === clientSecret) {
    next();
  } else {
    res.status(401).json({
      error: "Unauthorized",
    });
  }
};
