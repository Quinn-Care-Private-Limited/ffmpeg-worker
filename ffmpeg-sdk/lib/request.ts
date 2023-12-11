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
    timeout: 10 * 60 * 1000,
  });

  return axiosInstance;
};

export async function request<T = any>(axiosInstance: AxiosInstance, url: string, body: Record<string, any>) {
  try {
    const { data } = await axiosInstance.post(url, body);
    return data as T;
  } catch (error) {
    const err = error as AxiosError<string>;
    throw new Error(err.response?.data || err.message);
  }
}
