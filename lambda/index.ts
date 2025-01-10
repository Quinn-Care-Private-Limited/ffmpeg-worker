import { Context, APIGatewayProxyResult } from "aws-lambda";
import {
  multiProcessHandler,
  multiProcessScheduleHandler,
  multiProcessScheduleSchema,
  multiProcessSchema,
  processHandler,
  processScheduleHandler,
  processScheduleSchema,
  processSchema,
  testHandler,
  vmafHandler,
  vmafSchema,
} from "handlers/ffmpeg";
import { IHandlerResponse } from "handlers/types";
import { z } from "zod";

const requestValidator = async (schema: z.ZodSchema, body: any) => {
  const result = await schema.safeParseAsync(body);
  if (!result.success) {
    const error = new Error();
    error.message = JSON.stringify({
      errors: result.error.errors,
    });
    throw error;
  }
};

export const handler = async (event: any, context: Context): Promise<APIGatewayProxyResult> => {
  if (process.env.NODE_ENV === "development") {
    console.log("Received event:", JSON.stringify(event, null, 2));
  }
  const { path, body } = event;

  let resp: IHandlerResponse;

  try {
    switch (path as string) {
      case "ffmpeg/test": {
        resp = await testHandler();
        break;
      }
      case "ffmpeg/process": {
        await requestValidator(processSchema, body);
        resp = await processHandler(body);
        break;
      }
      case "ffmpeg/process/schedule": {
        await requestValidator(processScheduleSchema, body);
        resp = await processScheduleHandler(body);
        break;
      }
      case "ffmpeg/multi_process": {
        await requestValidator(multiProcessSchema, body);
        resp = await multiProcessHandler(body);
        break;
      }
      case "ffmpeg/multi_process/schedule": {
        await requestValidator(multiProcessScheduleSchema, body);
        resp = await multiProcessScheduleHandler(body);
        break;
      }
      case "ffmpeg/vmaf": {
        await requestValidator(vmafSchema, body);
        resp = await vmafHandler(body);
        break;
      }

      default: {
        resp = {
          status: 400,
          data: {
            error: "Invalid path",
          },
        };
      }
    }

    return {
      statusCode: resp.status,
      body: JSON.stringify(resp.data),
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: error.message,
    };
  }
};
