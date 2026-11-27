import "server-only";
import { PermanentJobError } from "./jobs/errors";
import { getBucketName, getS3Client } from "./s3";

// Downloads an object from S3 into memory.
export async function downloadFromS3(file_key: string): Promise<Buffer> {
    let obj;
    try {
        obj = await getS3Client().getObject({ Bucket: getBucketName(), Key: file_key });
    } catch (err: any) {
        // the upload never finished or the object was removed; retrying won't bring it back
        if (err?.name === "NoSuchKey") throw new PermanentJobError("The uploaded file is missing. Please upload it again.");
        throw err;
    }
    if (!obj.Body) throw new Error(`Empty S3 object: ${file_key}`);
    return Buffer.from(await obj.Body.transformToByteArray());
}
