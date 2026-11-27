import "server-only";
import { getBucketName, getS3Client } from "./s3";

// Downloads an object from S3 into memory.
export async function downloadFromS3(file_key: string): Promise<Buffer> {
    const obj = await getS3Client().getObject({ Bucket: getBucketName(), Key: file_key });
    if (!obj.Body) throw new Error(`Empty S3 object: ${file_key}`);
    return Buffer.from(await obj.Body.transformToByteArray());
}
