import { AxiosError } from "axios";

export class LamarUtils {
  static generateRandomId(length: number = 9) {
    return Math.random().toString(36).substr(2, length);
  }

  static sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  static retry(axiosInstance: any, retryIntervals: number[]) {
    return async (payload: any) => {
      for (let i = 0; i < retryIntervals.length; i++) {
        try {
          return await axiosInstance(payload);
        } catch (err) {
          const error: AxiosError = err as unknown as AxiosError;
          if (retryIntervals[i] === retryIntervals[retryIntervals.length - 1]) {
            throw error;
          }
          if (error.response?.status === 429) {
            await LamarUtils.sleep(retryIntervals[i]);
          } else {
            throw error.response?.data;
          }
        }
      }
    };
  }
}
