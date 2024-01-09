import { AxiosInstance } from "axios";
import { IClientCredentials } from "../types";
import { getAxiosInstance, request } from "../request";

export class Files {
  private axios: AxiosInstance;

  constructor(credentials: IClientCredentials) {
    this.axios = getAxiosInstance(credentials);
  }

  path() {
    return request<{ path: string }>(this.axios, "/files/path", {});
  }

  list(path: string) {
    return request<{ list: string[] }>(this.axios, "/files/list", { path });
  }

  check(path: string) {
    return request<{ isExists: boolean; isDirectory?: boolean }>(this.axios, "/files/check", { path });
  }

  create(path: string, data?: string) {
    return request<{}>(this.axios, "/files/create", { path, data });
  }

  read(path: string) {
    return request<{ data: string }>(this.axios, "/files/read", { path });
  }

  delete(path: string) {
    return request<{}>(this.axios, "/files/delete", { path });
  }

  info(path: string) {
    return request<{ data: Record<string, string> }>(this.axios, "/files/info", { input: path });
  }

  copy(input: string, output: string) {
    return request<{}>(this.axios, "/files/copy", { input, output });
  }
}
