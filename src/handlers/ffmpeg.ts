import cuid2 from "@paralleldrive/cuid2";
import { IHandlerResponse } from "../types";
import { runProcess } from "../utils";
import { z } from "zod";


export const processSchema = z.object({
  chainCmds: z.array(z.string()).optional(),
  output: z.string().optional(),
});

export const processHandler = async (body: z.infer<typeof processSchema>): Promise<IHandlerResponse> => {
  try {
    const data = await runProcess(body);
    return {
      status: 200,
      data: {
        output: data,
      },
    };
  } catch (error) {
    return {
      status: 400,
      data: {
        error: error.message,
      },
    };
  }
};


