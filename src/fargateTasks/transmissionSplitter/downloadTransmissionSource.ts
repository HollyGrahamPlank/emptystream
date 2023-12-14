import * as fs from "fs";
import * as path from "path";
import { Readable } from "stream";
import { ensurePathExists, getSourceAudioDir } from "./tempDir.js";
import TransmissionSource from "../../s3/transmissionSource.js";

//
//  Local Functions
//

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
 * @param id The ID of the Transmission to download the source audio for.
 */
export default async function downloadTransmissionSource(id: string) {
  // Make sure that we have a tmp directory for this transmission
  await ensurePathExists(getSourceAudioDir(id));

  // Start downloading the file from S3
  const { Body } = await TransmissionSource.get(id);

  // Pipe the downloading file into a file on disk
  await pipeBodyToFile(Body, path.join(getSourceAudioDir(id), id));
}
