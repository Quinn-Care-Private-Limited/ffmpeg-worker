import { Asset } from "../asset";
import { LamarRequest } from "../request";
const INTERVAL = 15000;
const MAX_TRACK_COUNT = 30;

export class JobStatusCheck extends LamarRequest {
  private activeSubscriptions: Array<{
    jobId: string;
    startedAt: number;
    intervalId: NodeJS.Timeout;
  }> = [];
  private asset: Asset;
  constructor({ apiKey }: { apiKey: string }) {
    super({ apiKey });
    if (!apiKey) {
      throw new Error("API Key is required");
    }
    this.asset = new Asset({ apiKey });
  }
  subscribe(
    jobId: string,
    callback: (data: any) => void,
  ): {
    message: "ALREADY_SUBSCRIBED" | "SUBSCRIPTION_SUCCESS" | "SUBSCRIPTION_TIMEOUT";
    ok: boolean;
  } {
    if (this.activeSubscriptions.find((sub) => sub.jobId === jobId)) {
      return { message: "ALREADY_SUBSCRIBED", ok: false };
    }
    let trackCount = 0;

    // check the status of the job every 10 seconds for next 15 minutes
    const intervalId = setInterval(async () => {
      const job = await this.getJobStatus(jobId);
      if (!job) {
        this.unsubscribe(jobId);
        callback({ message: "JOB_NOT_FOUND", ok: false });
        return;
      }
      const subscription = this.activeSubscriptions.find((sub) => sub.jobId == jobId);
      if (!subscription || trackCount > MAX_TRACK_COUNT) {
        this.unsubscribe(jobId);
        callback({ message: "TIMEOUT", ok: false, data: null });
        return;
      }
      if (job.status == "PENDING") {
        trackCount++;
        return;
      }
      if (job.status == "READY") {
        this.unsubscribe(jobId);
        callback({ message: "JOB_READY", ok: true, data: job });
      }
      if (job.status == "FAILED") {
        this.unsubscribe(jobId);
        callback({ message: "JOB_FAILED", ok: false, data: null });
      }

      trackCount++;
    }, INTERVAL);
    this.activeSubscriptions.push({ jobId, startedAt: Date.now(), intervalId });

    return { message: "SUBSCRIPTION_SUCCESS", ok: true };
  }

  async getJobStatus(jobId: string) {
    const response = await this.asset.assetById({ id: jobId });
    return response;
  }
  unsubscribe(jobId: string) {
    const subscription = this.activeSubscriptions.find((sub) => sub.jobId == jobId);
    if (subscription) {
      clearInterval(subscription.intervalId);
      this.activeSubscriptions = this.activeSubscriptions.filter((sub) => sub.jobId != jobId);
    }
    return { message: "UNSUBSCRIBED", ok: true, jobId };
  }
}
