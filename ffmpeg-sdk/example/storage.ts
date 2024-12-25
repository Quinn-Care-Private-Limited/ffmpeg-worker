import { Storage } from "../lib";

async function main() {
  const storage = new Storage(
    {
      clientId: "QUINNCLIENTID",
      clientSecret: "QUINNCLIENTSECRET",
      clientServerUrl: "http://localhost:4000/api",
    },
    {
      accessKeyId: "",
      secretAccessKey: "",
      region: "us-east-2",
    },
  );
  console.log("Downloading file");
  await storage.download({
    bucket: "quinnvideos-dev",
    key: "mediaid/mediaid.mp4",
    path: "mediaid/mediaid.mp4",
    multipart: true,
  });
}

main();
