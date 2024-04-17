import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { LamarUtils } from "../util";
const BASE_URL = "https://api.lamar.live/v1";

export class LamarRequest {
  private axiosInstance: AxiosInstance;
  constructor({ apiKey }: { apiKey: string }) {
    if (!apiKey) {
      throw new Error("API Key is required");
    }
    this.axiosInstance = axios.create({
      baseURL: BASE_URL,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
    });
  }

  protected async request(payload: AxiosRequestConfig) {
    try {
      const data = await LamarUtils.retry(this.axiosInstance, [1000])(payload);
      return data?.data?.data;
    } catch (err: any) {
      throw err?.response?.data;
    }
  }
}
