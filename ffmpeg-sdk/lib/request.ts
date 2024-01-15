import axios, { AxiosError, AxiosInstance } from "axios";
import { IClientCredentials } from "./types";

export const getAxiosInstance = (credentials: IClientCredentials) => {
  const axiosInstance = axios.create({
    baseURL: credentials.clientServerUrl,
    headers: {
      "x-client-id": credentials.clientId,
      "x-client-secret": credentials.clientSecret,
      "Content-Type": "application/json",
    },
    timeout: 60 * 60 * 1000,
  });

  return axiosInstance;
};

export async function request<T = any>(
  axiosInstance: AxiosInstance,
  url: string,
  body: Record<string, any>,
): Promise<T & { responseTime: number }> {
  try {
    const { data, headers } = await axiosInstance.post(url, body);
    return { ...data, responseTime: +headers["X-Response-Time"] };
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
