import { AxiosInstance } from "axios";
import { IClientCredentials, IFileInfo, ResponseCallback } from "../types";
import { getAxiosInstance, request } from "../request";

export class Files {
  private axios: AxiosInstance;

  constructor(credentials: IClientCredentials, private responseCallback?: ResponseCallback) {
    this.axios = getAxiosInstance(credentials, responseCallback);
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
    return request<{ data: IFileInfo }>(this.axios, "/files/info", { input: path });
  }

  copy(input: string, output: string) {
    return request<{}>(this.axios, "/files/copy", { input, output });
  }

  download(url: string, output: string) {
    return request<{}>(this.axios, "/files/download", { url, output });
  }
}
