import { PutObjectCommandInput } from "@aws-sdk/client-s3";

/** These are the types that can be stored with AWS S3 buckets. */
// export type AwsStoreTypes = string | Uint8Array | Buffer | Readable | ReadableStreamOptionalType | BlobOptionalType;
export type AwsStoreTypes = PutObjectCommandInput['Body'];