// Creates the S3 bucket used by the e2e tests on an S3-compatible endpoint (moto/MinIO).
import { CreateBucketCommand, S3Client } from "@aws-sdk/client-s3";

const s3 = new S3Client({
    region: process.env.S3_REGION || "ap-south-1",
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true,
    credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY },
});
await s3.send(new CreateBucketCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    CreateBucketConfiguration: { LocationConstraint: process.env.S3_REGION || "ap-south-1" },
}));
console.log(`bucket ${process.env.S3_BUCKET_NAME} ready`);
