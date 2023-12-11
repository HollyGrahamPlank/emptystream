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
      hostname: "localhost",
      port: 4569,
      path: "",
      protocol: "http:",
    },
  });
}

const s3Client = createS3Client();
export default s3Client;
