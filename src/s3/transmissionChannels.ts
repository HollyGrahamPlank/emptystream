import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import getFullBucketName from "./getFullBucketName.js";
import s3Client from "./s3Client.js";

const bucketName = getFullBucketName("mainBucket");

function translateKey(id: string, type: string): string {
  return `transmissions/${id}/channels/${type}.mp3`;
}

//
//  Namespace
//

namespace TransmissionChannel {
  export function upload(id: string, type: string, file: Buffer) {
    return s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: translateKey(id, type),
        Body: file,
      }),
    );
  }

  export function get(id: string, type: string) {
    return s3Client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: translateKey(id, type),
      }),
    );
  }

  export function peek(id: string, type: string) {
    return s3Client.send(
      new HeadObjectCommand({
        Bucket: bucketName,
        Key: translateKey(id, type),
      }),
    );
  }

  export function remove(id: string, type: string) {
    return s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: translateKey(id, type),
      }),
    );
  }
}
export default TransmissionChannel;
