import express from "express";
import { z } from "zod";

export const validateRequest =
  (schema: z.ZodSchema) => async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const result = await schema.safeParseAsync(req.body);

    if (result.success) {
      next();
    } else {
      // Validation failed
      console.log(result.error.errors);
      res.status(400).json({
        errors: result.error.errors,
      });
    }
  };
