import { S3Connector } from "cloud-storage/s3";

async function main() {
  const s3 = new S3Connector();
  await s3.downloadMultipartObject({
    bucketName: "cdnsampletest",
    objectKey: "organisationid/envid/asset3/original.mp4",
    filePath: "/Users/razbotics/projects/ffmpeg-worker/efs/source/test.mp4",
    debug: true,
  });
}

main();
