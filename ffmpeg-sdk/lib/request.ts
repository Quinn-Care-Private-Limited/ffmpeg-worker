import axios, { AxiosError, AxiosInstance } from "axios";
import { IClientCredentials, ResponseCallback } from "./types";

export const getAxiosInstance = (credentials?: IClientCredentials, responseCallback?: ResponseCallback) => {
  const axiosInstance = axios.create({
    baseURL: credentials?.clientServerUrl,
    headers: {
      "x-client-id": credentials?.clientId,
      "x-client-secret": credentials?.clientSecret,
      "Content-Type": "application/json",
    },
    timeout: 60 * 60 * 1000,
  });

  axiosInstance.interceptors.response.use((resp) => {
    responseCallback?.({
      responseTime: +resp.headers["x-response-time"],
      path: resp.config.url || "",
      method: resp.config.method || "",
      baseURL: resp.config.baseURL || "",
      status: resp.status,
    });
    return resp;
  });

  return axiosInstance;
};

export async function request<T = any>(
  axiosInstance: AxiosInstance,
  url: string,
  body: Record<string, any>,
): Promise<T> {
  try {
    const { data } = await axiosInstance.post(url, body);
    return data;
  } catch (error) {
    const err = error as AxiosError<string>;
    throw new Error(err.response?.data || err.message);
  }
}

export async function requestWithResponseAbort(axiosInstance: AxiosInstance, url: string, body: Record<string, any>) {
  try {
    await axiosInstance.post(url, body, {
      signal: AbortSignal.timeout(5000),
    });
  } catch (error) {
    const err = error as AxiosError<string>;
    if (err.code !== "ERR_CANCELED") {
      throw new Error(err.response?.data || err.message);
    }
  }
}
