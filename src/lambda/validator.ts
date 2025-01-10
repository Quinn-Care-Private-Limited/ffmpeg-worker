import { z } from "zod";

export const requestValidator = async (schema: z.ZodSchema, body: any) => {
  const result = await schema.safeParseAsync(body);
  if (!result.success) {
    const error = new Error();
    error.message = JSON.stringify({
      errors: result.error.errors,
    });
    throw error;
  }
};
