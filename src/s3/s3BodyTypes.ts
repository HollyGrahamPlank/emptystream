import { PutObjectRequest } from "@aws-sdk/client-s3";
import { Readable } from "stream";

export type S3InputBodyType = PutObjectRequest["Body"] | string | Uint8Array | Buffer;
export type S3OutputBodyType = Readable | ReadableStream | Blob;
