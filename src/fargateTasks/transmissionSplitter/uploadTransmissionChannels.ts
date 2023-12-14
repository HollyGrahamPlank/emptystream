import * as fs from "fs";
import { promises as fsPromise } from "fs";
import * as path from "path";
import TransmissionChannel from "../../s3/transmissionChannel.js";
import { getSplitAudioDir } from "./tempDir.js";

//
//  Exports
//

/**
 * Uploads each split found in the temporary working directory to S3, as transmission channels.
 *
 * @param id The ID of the emptystream Transmission that we are uploading channels to.
 */
export default async function uploadTransmissionChannel(id: string) {
  // For each split that exists...
  const pathToSplits = getSplitAudioDir(id);
  const splitNames: string[] = await fsPromise.readdir(pathToSplits);
  await Promise.all(
    splitNames.map(async (fileName) => {
      // ...upload it to S3!
      const fileReadStream = fs.createReadStream(path.join(pathToSplits, fileName));
      await TransmissionChannel.upload(id, fileName, fileReadStream);
      fileReadStream.destroy();
    }),
  );
}
