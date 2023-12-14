import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as path from "path";
import { Readable } from "stream";
import { ensurePathExists, getSourceAudioDir } from "./tempDir.js";

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

/**
 * Grab a single file from an S3 Bucket, using a new client.
 *
 * @param bucketName The name of the bucket to grab the file from.
 * @param fileKey The full path of the file that we want to get.
 * @returns Information about the file including the file's body
 */
async function getFileFromS3(bucketName: string, fileKey: string) {
  const client = createS3Client();
  return await client.send(new GetObjectCommand({ Bucket: bucketName, Key: fileKey }));
}

/**
 * Pipe a file body from S3 into a new file on disk.
 *
 * @param body The body as returned by `getFileFromS3`.
 * @param fileName The name of the file that we want to create on disk.
 * @returns A promise that resolves when the file has finished being written.
 */
function pipeBodyToFile(body: Readable | ReadableStream | Blob | undefined, fileName: string) {
  if (!body) throw new Error("No body found");
  if (!(body instanceof Readable)) throw new Error("Body isn't readable instance");

  // As long as the body stream is readable, pipe it into a file!
  return new Promise<void>((resolve, reject) => {
    body
      .pipe(fs.createWriteStream(fileName))
      .on("error", (err) => reject(err))
      .on("close", () => resolve());
  });
}

//
//  Exports
//

/**
 * Downloads the desired emptystream Transmission source audio to a file on disk.
 *
 * @param bucketName The name of the bucket that contains all Transmissions
 * @param id The ID of the Transmission to download the source audio for.
 */
export default async function downloadTransmissionSource(bucketName: string, id: string) {
  // Make sure that we have a tmp directory for this transmission
  await ensurePathExists(getSourceAudioDir(id));

  // Start downloading the file from S3
  const { Body } = await getFileFromS3(bucketName, `transmissions/${id}/sourceAudio`);

  // Pipe the downloading file into a file on disk
  await pipeBodyToFile(Body, path.join(getSourceAudioDir(id), id));
}
