import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { LamarUtils } from "../util";

export class LamarRequest {
  private axiosInstance: AxiosInstance;
  constructor({ apiKey }: { apiKey: string }) {
    if (!apiKey) {
      throw new Error("API Key is required");
    }
    this.axiosInstance = axios.create({
      baseURL: "https://api.quinn.live/api",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
    });
  }

  request(payload: AxiosRequestConfig) {
    if (process.env.LAMAR_TESTING_MODE) {
      return Promise.resolve(payload);
    }
    return Promise.resolve(payload);
    // return LamarUtils.retry(this.axiosInstance.request, [1000, 2000, 3000])(payload);
  }
}
