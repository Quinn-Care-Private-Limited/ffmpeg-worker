import axios from "axios";
import { IWebhookResponse } from "types";

export const sendWebhook = async (url: string, payload: IWebhookResponse) => {
  try {
    await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        "x-client-id": process.env.CLIENT_ID || "",
        "x-client-secret": process.env.CLIENT_SECRET || "",
      },
    });
  } catch (error) {
    console.log(`Error invoking callbackUrl ${url}`, error.message);
  }
};
