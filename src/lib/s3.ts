// Server-only S3 helpers. Never import this file from a "use client" component:
// it reads the AWS secret key, which must stay on the server.
import "server-only";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3 } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomBytes } from "crypto";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
const UPLOAD_URL_TTL_SECONDS = 60;
const VIEW_URL_TTL_SECONDS = 15 * 60;

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing environment variable ${name}`);
    }
    return value;
}

export function getBucketName() {
    return requireEnv("S3_BUCKET_NAME");
}

let client: S3 | null = null;

export function getS3Client() {
    if (!client) {
        const endpoint = process.env.S3_ENDPOINT; // optional, e.g. MinIO: http://localhost:9000
        client = new S3({
            region: process.env.S3_REGION || "ap-south-1",
            ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
            credentials: {
                accessKeyId: requireEnv("S3_ACCESS_KEY_ID"),
                secretAccessKey: requireEnv("S3_SECRET_ACCESS_KEY"),
            },
        });
    }
    return client;
}

// Uploads live under the owner's id, so /api/create-chat can check that a key
// belongs to the user creating the chat. The random part makes keys unguessable.
// Example: uploads/6f1c…/1708543562858-9f86d081_aws-docs.pdf
export function userUploadPrefix(userId: string) {
    return `uploads/${userId}/`;
}

export function buildFileKey(userId: string, fileName: string) {
    const safeName = fileName.replace(/[^A-Za-z0-9._-]+/g, "-");
    return `${userUploadPrefix(userId)}${Date.now()}-${randomBytes(4).toString("hex")}_${safeName}`;
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

// Short-lived URL for viewing a PDF; the bucket itself can stay private.
export async function createViewUrl(fileKey: string) {
    const command = new GetObjectCommand({
        Bucket: getBucketName(),
        Key: fileKey,
        ResponseContentType: "application/pdf",
        ResponseContentDisposition: "inline",
    });
    return getSignedUrl(getS3Client(), command, { expiresIn: VIEW_URL_TTL_SECONDS });
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
