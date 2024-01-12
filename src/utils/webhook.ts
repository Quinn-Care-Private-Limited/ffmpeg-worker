import axios from "axios";
import { IWebhookResponse } from "types";
import { sleep } from "./app";

const MAX_RETRIES = 3;
export const sendWebhook = async (url: string, payload: IWebhookResponse, responseTime = 0, retries = 0) => {
  try {
    await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        "x-client-id": process.env.CLIENT_ID || "",
        "x-client-secret": process.env.CLIENT_SECRET || "",
        "X-Response-Time": responseTime,
      },
    });
  } catch (error) {
    if (retries < MAX_RETRIES) {
      await sleep(1000);
      await sendWebhook(url, payload, responseTime, retries + 1);
    } else {
      console.log(`Error invoking callbackUrl ${url}`, error.message);
    }
  }
};
