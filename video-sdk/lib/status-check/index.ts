import { LamarRequest } from "../request";
const INTERVAL = 15000;
const MAX_TRACK_COUNT = 10;
export class JobStatusCheck extends LamarRequest {
  private activeSubscriptions: Array<{
    jobId: string;
    startedAt: number;
    intervalId: NodeJS.Timeout;
  }> = [];
  constructor({ apiKey }: { apiKey: string }) {
    super({ apiKey });
    if (!apiKey) {
      throw new Error("API Key is required");
    }
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
      const subscription = this.activeSubscriptions.find((sub) => sub.jobId == jobId);
      console.log(`track count`, trackCount);
      if (!subscription || trackCount > MAX_TRACK_COUNT) {
        this.unsubscribe(jobId);
        callback({ message: "TIMEOUT", ok: false });
        return;
      }
      if (job.status === "completed") {
        this.unsubscribe(jobId);
        callback(job);
        return;
      }
      if (job.status === "failed") {
        this.unsubscribe(jobId);
        callback(job);
        return;
      }
      trackCount++;
    }, INTERVAL);
    this.activeSubscriptions.push({ jobId, startedAt: Date.now(), intervalId });

    return { message: "SUBSCRIPTION_SUCCESS", ok: true };
  }

  async getJobStatus(jobId: string) {
    const response = await this.request({ url: `/jobs/${jobId}`, data: { status: "PROCESSING" } });
    return response.data;
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
