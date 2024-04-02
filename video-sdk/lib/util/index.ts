export class LamarUtils {
  static generateRandomId(length: number = 9) {
    return Math.random().toString(36).substr(2, length);
  }

  static retry(fn: Function, delay: number[]) {
    return async function (...args: any) {
      for (let i = 0; i < delay.length; i++) {
        try {
          return await fn(...args);
        } catch (e) {
          if (i === delay.length) {
            throw e;
          }
          await new Promise((resolve) => setTimeout(resolve, delay[i]));
        }
      }
    };
  }
}
