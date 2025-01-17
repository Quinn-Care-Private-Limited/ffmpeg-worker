import { Context, APIGatewayProxyResult } from "aws-lambda";
import { IHandlerResponse } from "types";
import { requestValidator } from "./validator";
import {
  multiProcessHandler,
  multiProcessScheduleHandler,
  multiProcessScheduleSchema,
  multiProcessSchema,
  probeHandler,
  probeSchema,
  processHandler,
  processScheduleHandler,
  processScheduleSchema,
  processSchema,
  testHandler,
  vmafHandler,
  vmafSchema,
} from "handlers/ffmpeg";

export const handler = async (event: any, context: Context): Promise<APIGatewayProxyResult> => {
  if (process.env.NODE_ENV === "development") {
    console.log("Received event:", JSON.stringify(event, null, 2));
  }
  const { path, body } = event;

  let resp: IHandlerResponse;

  try {
    switch (path as string) {
      //ffmpeg
      case "/ffmpeg/test": {
        resp = await testHandler();
        break;
      }
      case "/ffmpeg/process": {
        await requestValidator(processSchema, body);
        resp = await processHandler(body);
        break;
      }
      case "/ffmpeg/process/schedule": {
        await requestValidator(processScheduleSchema, body);
        resp = await processScheduleHandler(body);
        break;
      }
      case "/ffmpeg/multi_process": {
        await requestValidator(multiProcessSchema, body);
        resp = await multiProcessHandler(body);
        break;
      }
      case "/ffmpeg/multi_process/schedule": {
        await requestValidator(multiProcessScheduleSchema, body);
        resp = await multiProcessScheduleHandler(body);
        break;
      }
      case "/ffmpeg/vmaf": {
        await requestValidator(vmafSchema, body);
        resp = await vmafHandler(body);
        break;
      }
      case "/ffmpeg/probe": {
        await requestValidator(probeSchema, body);
        resp = await probeHandler(body);
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
