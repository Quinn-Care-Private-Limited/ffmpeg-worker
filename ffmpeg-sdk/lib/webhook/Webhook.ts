import { Router } from "express";
import { IWebhookResponse } from "../types";

export class Webhook {
  static createWebhook(
    router: Router,
    path: string,
    callback: (payload: IWebhookResponse, credentials: { clientId: string; clientSecret: string }) => Promise<void>,
  ) {
    router.post(path, async (req, res) => {
      try {
        const payload = req.body;
        await callback(payload, {
          clientId: req.headers["x-client-id"] as string,
          clientSecret: req.headers["x-client-secret"] as string,
        });
        res.status(200).send("Ok");
      } catch (error) {
        res.status(400).send("Error in callback");
      }
    });
  }
}
