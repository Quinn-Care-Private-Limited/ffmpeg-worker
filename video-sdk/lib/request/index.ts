import axios, { AxiosInstance } from "axios";
interface XelpRequestPost {
  data: Record<string, any>;
}
export class XelpRequest {
  private axiosInstance: AxiosInstance;
  constructor({ apiKey }: { apiKey: string }) {
    if (!apiKey) {
      throw new Error("API Key is required");
    }
    this.axiosInstance = axios.create({
      baseURL: "https://api.quinn.live/api/jobs",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
    });
  }

  post({ data }: XelpRequestPost) {
    if (process.env.XELP_TESTING_MODE) {
      return Promise.resolve({ data });
    }
    // return this.axiosInstance.post("https://api.quinn.live/api/jobs", data, {});
  }
}
