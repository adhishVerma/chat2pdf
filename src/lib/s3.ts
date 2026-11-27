// Server-only S3 helpers. Never import this file from a "use client" component:
// it reads the AWS secret key, which must stay on the server.
import "server-only";
import { DeleteObjectCommand, PutObjectCommand, S3 } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3_REGION, getS3Url } from "./s3-url";

export { getS3Url };

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
const UPLOAD_URL_TTL_SECONDS = 60;

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing environment variable ${name}`);
    }
    return value;
}

export function getBucketName() {
    return requireEnv("NEXT_PUBLIC_S3_BUCKET_NAME");
}

let client: S3 | null = null;

export function getS3Client() {
    if (!client) {
        client = new S3({
            region: S3_REGION,
            credentials: {
                accessKeyId: requireEnv("S3_ACCESS_KEY_ID"),
                secretAccessKey: requireEnv("S3_SECRET_ACCESS_KEY"),
            },
        });
    }
    return client;
}

export function buildFileKey(fileName: string) {
    // file_key example: uploads/1708543562858_aws-docs.pdf
    const safeName = fileName.replace(/[^A-Za-z0-9._-]+/g, "-");
    return `uploads/${Date.now().toString()}_${safeName}`;
}

// Returns a short-lived URL the browser can PUT the PDF to directly.
export async function createUploadUrl(fileKey: string, contentLength: number) {
    const command = new PutObjectCommand({
        Bucket: getBucketName(),
        Key: fileKey,
        ContentType: "application/pdf",
        ContentLength: contentLength,
    });
    return getSignedUrl(getS3Client(), command, { expiresIn: UPLOAD_URL_TTL_SECONDS });
}

export async function deleteFromS3(fileKey: string) {
    try {
        await getS3Client().send(new DeleteObjectCommand({
            Bucket: getBucketName(),
            Key: fileKey,
        }));
    } catch (err) {
        console.error("Failed to delete object from S3", err);
    }
}
