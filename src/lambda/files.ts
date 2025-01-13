import { Context, APIGatewayProxyResult } from "aws-lambda";
import { IHandlerResponse } from "types";
import { requestValidator } from "./validator";
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

export const handler = async (event: any, context: Context): Promise<APIGatewayProxyResult> => {
  if (process.env.NODE_ENV === "development") {
    console.log("Received event:", JSON.stringify(event, null, 2));
  }
  const { path, body } = event;

  let resp: IHandlerResponse;

  try {
    switch (path as string) {
      //files
      case "files/path": {
        resp = await pathHandler();
        break;
      }
      case "files/list": {
        await requestValidator(listSchema, body);
        resp = await listHandler(body);
        break;
      }
      case "files/check": {
        await requestValidator(checkSchema, body);
        resp = await checkHandler(body);
        break;
      }
      case "files/create": {
        await requestValidator(createSchema, body);
        resp = await createHandler(body);
        break;
      }
      case "files/read": {
        await requestValidator(readSchema, body);
        resp = await readHandler(body);
        break;
      }
      case "files/delete": {
        await requestValidator(deleteSchema, body);
        resp = await deleteHandler(body);
        break;
      }
      case "files/info": {
        await requestValidator(infoSchema, body);
        resp = await infoHandler(body);
        break;
      }
      case "files/copy": {
        await requestValidator(copySchema, body);
        resp = await copyHandler(body);
        break;
      }
      case "files/download": {
        await requestValidator(downloadFileSchema, body);
        resp = await downloaFileHandler(body);
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
