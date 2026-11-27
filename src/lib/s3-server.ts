import fs from "fs"
import { getBucketName, getS3Client } from "./s3";

export async function downloadFroms3(file_key: string): Promise<string> {
    return new Promise((async (resolve, reject) => {
        try {
            const params = {
                Bucket: getBucketName(),
                Key: file_key,
            }
            const obj = await getS3Client().getObject(params);
            const file_name = `/tmp/helix${Date.now().toString()}.pdf`;

            if (obj.Body instanceof require('stream').Readable) {
                const file = fs.createWriteStream(file_name);
                file.on("open", () => {
                    //@ts-ignore
                    obj.Body?.pipe(file).on("finish", () => resolve(file_name))
                })
            } else {
                reject(new Error("Unexpected S3 response body"));
            }
        } catch (err) {
            console.error(err);
            reject(err);
        }
    }))
}
