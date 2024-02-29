import { PutObjectCommandInput, PutObjectCommandOutput, S3 } from '@aws-sdk/client-s3';

export async function uploadToS3(file: File): Promise<{ file_key: string; file_name: string }> {

    return new Promise((resolve, reject) => {

        try {
            const s3 = new S3({
                region: 'ap-south-1',
                credentials: {
                    accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID!,
                    secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY!
                }
            })

            // file_key example: 0065245544000_aws_docs.pdf
            const file_key = `uploads/${Date.now().toString()}_${file.name.replace(" ", "-")}`

            // file upload params
            const params: PutObjectCommandInput = {
                Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME,
                Key: file_key,
                Body: file,
                ContentType: 'application/pdf'
            }

            s3.putObject(params, (err: any, data: PutObjectCommandOutput | undefined) => {
                return resolve({
                    file_key,
                    file_name: file.name,
                })
            })
        } catch (err) {
            return reject(err);
        }
    })
}

export function getS3Url(file_key: string) {
    // https://chatpdf-helix.s3.ap-south-1.amazonaws.com/uploads/1708543562858_ipc.pdf
    const url = file_key && file_key.length ? `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.ap-south-1.amazonaws.com/${file_key}` : '';
    return url;
}