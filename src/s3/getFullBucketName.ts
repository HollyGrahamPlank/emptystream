import getCriticalEnvVariable from "../getCriticalEnvVariable.js";

/**
 * Given a bucket name, constructs the string for a full bucket name.
 *
 * @example
 *   // When running locally...
 *   getFullBucketName("bucket") => "dev-emptystream-mainBucket"
 *
 * @param bucketName The short name of the bucket.
 * @returns The full name for a bucket.
 */
export default function getFullBucketName(bucketName: string) {
  return `${getCriticalEnvVariable("SLS_STAGE")}-${getCriticalEnvVariable(
    "SERVICE_NAME",
  )}-${bucketName}`;
}
