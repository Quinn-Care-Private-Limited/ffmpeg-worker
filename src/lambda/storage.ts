import { Context, APIGatewayProxyResult } from "aws-lambda";
import { IHandlerResponse } from "types";
import { requestValidator } from "./validator";
import {
  downloadHandler,
  downloadScheduleHandler,
  downloadScheduleSchema,
  downloadSchema,
  uploadHandler,
  uploadScheduleHandler,
  uploadScheduleSchema,
  uploadSchema,
} from "handlers/storage";
import { S3Connector } from "cloud-storage/s3";

export const handler = async (event: any, context: Context): Promise<APIGatewayProxyResult> => {
  if (process.env.NODE_ENV === "development") {
    console.log("Received event:", JSON.stringify(event, null, 2));
  }
  const { path, body } = event;

  let resp: IHandlerResponse;
  const storage = new S3Connector();
  try {
    switch (path as string) {
      //storage
      case "/storage/download": {
        await requestValidator(downloadSchema, body);
        resp = await downloadHandler(body, storage);
        break;
      }
      case "/storage/download/schedule": {
        await requestValidator(downloadScheduleSchema, body);
        resp = await downloadScheduleHandler(body, storage);
        break;
      }
      case "/storage/upload": {
        await requestValidator(uploadSchema, body);
        resp = await uploadHandler(body, storage);
        break;
      }
      case "/storage/upload/schedule": {
        await requestValidator(uploadScheduleSchema, body);
        resp = await uploadScheduleHandler(body, storage);
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
