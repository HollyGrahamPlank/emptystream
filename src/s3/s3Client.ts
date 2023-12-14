import { S3Client } from "@aws-sdk/client-s3";

function createS3Client(): S3Client {
  // If we're running in the cloud... just make the client as normal. AWS should provide us creds.
  if (!process.env.IS_OFFLINE) return new S3Client({});

  // OTHERWISE - we're running locally. Assume we're using dummy credentials.
  return new S3Client({
    forcePathStyle: true,
    credentials: {
      accessKeyId: "S3RVER",
      secretAccessKey: "S3RVER",
    },
    endpoint: {
      hostname: process.env.OFFLINE_S3_HOST || "localhost",
      port: parseInt(process.env.OFFLINE_S3_PORT || "4569", 10),
      path: process.env.OFFLINE_S3_PATH || "",
      protocol: process.env.OFFLINE_S3_PROTOCOL || "http:",
    },
  });
}

const s3Client = createS3Client();
export default s3Client;
