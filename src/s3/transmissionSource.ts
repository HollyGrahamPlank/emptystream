import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import getFullBucketName from "./getFullBucketName.js";
import { S3InputBodyType } from "./s3BodyTypes.js";
import s3Client from "./s3Client.js";

const bucketName = getFullBucketName("mainBucket");

function translateKey(id: string): string {
  return `transmissions/${id}/sourceAudio`;
}

//
//  Namespace
//

namespace TransmissionSource {
  export function upload(id: string, file: S3InputBodyType) {
    return s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: translateKey(id),
        Body: file,
      }),
    );
  }

  export function get(id: string) {
    return s3Client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: translateKey(id),
      }),
    );
  }

  export function peek(id: string) {
    return s3Client.send(
      new HeadObjectCommand({
        Bucket: bucketName,
        Key: translateKey(id),
      }),
    );
  }

  export function remove(id: string) {
    return s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: translateKey(id),
      }),
    );
  }
}
export default TransmissionSource;
