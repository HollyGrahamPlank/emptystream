import downloadTransmissionSource from "./downloadTransmissionSource.js";
import splitAudio from "./splitAudio.js";
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

// Download the audio to a temporary directory
await downloadTransmissionSource(bucketName, transmissionId);

// Read the audio from that temporary directory, and split it
await splitAudio(transmissionId);

// Upload the split audio from the temporary directory to S3!
await uploadTransmissionChannel(bucketName, transmissionId);
