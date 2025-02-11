import { Context, APIGatewayProxyResult } from "aws-lambda";
import { IHandlerResponse } from "types";
import { requestValidator } from "./validator";
import { processHandler, processSchema } from "handlers/canvas";

export const handler = async (event: any, context: Context): Promise<APIGatewayProxyResult> => {
  if (process.env.NODE_ENV === "development") {
    console.log("Received event:", JSON.stringify(event, null, 2));
  }
  const { path, body } = event;

  let resp: IHandlerResponse;

  try {
    switch (path as string) {
      case "/canvas/process": {
        await requestValidator(processSchema, body);
        resp = await processHandler(body);
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
