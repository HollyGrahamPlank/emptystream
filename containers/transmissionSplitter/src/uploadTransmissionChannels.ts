import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSplitAudioDir } from "./tempDir.js";
import { promises as fsPromise } from "fs";
import * as fs from "fs";
import * as path from "path";

//
//  Local Functions
//

/** @returns A new S3 client to use. */
function createS3Client(): S3Client {
  // This is a function because in the future we may want to configure this client
  // specifically depending on the runtime environment, such as if we are running
  // this function locally.
  return new S3Client({});
}

async function putFileInS3(bucketName: string, fileKey: string, fileStream: ReadableStream) {
  const client = createS3Client();
  return await client.send(
    new PutObjectCommand({ Bucket: bucketName, Key: fileKey, Body: fileStream }),
  );
}

//
//  Exports
//

/**
 * Uploads each split found in the temporary working directory to S3, as transmission channels.
 *
 * @param bucketName The name of the S3 bucket to upload to
 * @param id The ID of the emptystream Transmission that we are uploading channels to.
 */
export default async function uploadTransmissionChannel(bucketName: string, id: string) {
  // For each split that exists...
  const pathToSplits = getSplitAudioDir(id);
  const splitNames: string[] = await fsPromise.readdir(pathToSplits);
  await Promise.all(
    splitNames.map(async (fileName) => {
      // ...upload it to S3!
      const fileReadStream = fs.createReadStream(path.join(pathToSplits, fileName));
      await putFileInS3(bucketName, `transmissions/${id}/channels/${fileName}`, fileReadStream);
      fileReadStream.destroy();
    }),
  );
}
