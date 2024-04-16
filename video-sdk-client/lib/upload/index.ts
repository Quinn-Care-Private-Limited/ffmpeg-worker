import axios from "axios";

export class Uploader {
  private file: File;
  private signedUrl: string;
  private startByte: number = 0;
  private isUploading = false;
  private uploadCompleted = false;
  private CHUNK_SIZE_IN_BYTES = 32 * 1024 * 1024; // 32MB
  private uploadFailedListeners: ((error: any) => void)[] = [];
  private uploadProgressListeners: ((progress: number) => void)[] = [];
  private uploadCompletedListeners: (() => void)[] = [];
  constructor({ file, signedUrl }: { file: File; signedUrl: string }) {
    this.file = file;
    this.signedUrl = signedUrl;
  }
  // Method to add event listener for upload failed event
  onUploadFailed(listener: (error: any) => void) {
    this.uploadFailedListeners.push(listener);
  }

  isUploadInProgress() {
    return this.isUploading;
  }
  isPaused() {
    return !this.isUploading;
  }

  // Method to add event listener for upload progress event
  onUploadProgress(listener: (progress: number) => void) {
    this.uploadProgressListeners.push(listener);
  }

  // Method to add event listener for upload completed event
  onUploadCompleted(listener: () => void) {
    this.uploadCompletedListeners.push(listener);
  }

  async checkIfUploadCompleted() {
    if (this.uploadCompleted) return true;
    try {
      await axios({
        method: "PUT",
        url: this.signedUrl,
        headers: {
          "Content-Range": `bytes */${this.file.size}`,
          "Content-Type": this.file.type,
        },
      });
      this.uploadCompleted = true;
      this.uploadCompletedListeners.forEach((listener) => {
        listener();
      });
      return true;
    } catch (err) {
      return false;
    }
  }
  private async uploadChunk() {
    if (this.uploadCompleted) {
      return;
    }

    if (this.startByte >= this.file.size) {
      this.uploadCompleted = true;
      this.uploadCompletedListeners.forEach((listener) => {
        listener();
      });
      return;
    }

    const chunk = this.file.slice(
      this.startByte,
      this.startByte + Math.min(this.CHUNK_SIZE_IN_BYTES, this.file.size - this.startByte),
    );
    const rangeHeader = `${this.startByte}-${Math.min(this.startByte + this.CHUNK_SIZE_IN_BYTES, this.file.size) - 1}`;

    try {
      await axios({
        method: "PUT",
        url: this.signedUrl,
        data: chunk,
        headers: {
          "Content-Range": `bytes ${rangeHeader}/${this.file.size}`,
          "Content-Type": this.file.type,
        },
      });
      this.checkIfUploadCompleted();
    } catch (err: any) {
      if (err?.response?.status == 308) {
        const receivedRange = err.response.headers.range;
        const bytes = receivedRange.split("-")[1];
        this.startByte = parseInt(bytes);
        const progress = Math.ceil((this.startByte / this.file.size) * 100);
        this.uploadProgressListeners.forEach((listener) => {
          listener(progress);
        });
        if (this.isUploading) {
          this.uploadChunk();
        }
      } else {
        this.uploadFailedListeners.forEach((listener) => {
          listener(err);
        });
      }
    }
  }

  async startUpload() {
    if (this.uploadCompleted) {
      this.uploadCompletedListeners.forEach((listener) => {
        listener();
      });
      return;
    }
    if (this.isUploading) {
      return;
    }
    this.isUploading = true;
    await this.uploadChunk();
  }

  pauseUpload() {
    this.isUploading = false;
  }

  resumeUpload() {
    if (this.isUploading) return;
    this.isUploading = true;
    this.uploadChunk();
  }
}
