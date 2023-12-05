import { GCStorageConnector } from "cloud-storage/gcs";
import { S3Connector } from "cloud-storage/s3";

async function main() {
  const s3 = new S3Connector();
  await s3.downloadMultipartObject({
    bucketName: "cdnsampletest",
    objectKey: "organisationid/envid/asset4/original.mp4",
    filePath: "/Users/razbotics/projects/ffmpeg-worker/efs/source/test.mp4",
    debug: true,
  });

  // const gcs = new GCStorageConnector();
  // await gcs.downloadMultipartObject({
  //   bucketName: "quinn-video-platform.appspot.com",
  //   objectKey: "test.mp4",
  //   filePath: "/Users/razbotics/projects/ffmpeg-worker/efs/source/test.mp4",
  //   debug: true,
  // });
}

main();
