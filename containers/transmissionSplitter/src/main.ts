import downloadTransmissionSource from "./downloadTransmissionSource.js";
import splitAudio from "./splitAudio.js";
import { cleanupTemporaryWorkingDir } from "./tempDir.js";
import uploadTransmissionChannel from "./uploadTransmissionChannels.js";

// Read the name of the bucket that stores transmission data from the env vars
const bucketName: string = process.env["BUCKET"] || "";
if (!bucketName) throw new Error("No bucket given");

// Read the ID of the transmission we want to split from the env vars
const transmissionId: string = process.env["ID"] || "";
if (!transmissionId) throw new Error("No transmission ID given");

//
//  Main
//

try {
  // 1. Download the audio to a temporary directory
  await downloadTransmissionSource(bucketName, transmissionId);

  // 2. Read the audio from that temporary directory, and split it
  await splitAudio(transmissionId);

  // 3. Upload the split audio from the temporary directory to S3!
  await uploadTransmissionChannel(bucketName, transmissionId);

  // ... and once the above 3 are done, we're good to go!
  console.log(`OK - Uploaded TransmissionChannels for ${transmissionId}`);
} catch (exception) {
  // If there was an exception - THROW IT
  throw exception;
} finally {
  // After either we finished the upload, or there was an error, make sure to cleanup the temp working dir
  await cleanupTemporaryWorkingDir(transmissionId);
}
