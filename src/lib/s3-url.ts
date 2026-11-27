// Client-safe S3 helpers: only uses the public bucket name, no credentials.
export const S3_REGION = "ap-south-1";

export function getS3Url(file_key: string) {
    // https://<bucket>.s3.ap-south-1.amazonaws.com/uploads/1708543562858_ipc.pdf
    const bucket = process.env.NEXT_PUBLIC_S3_BUCKET_NAME;
    return file_key && file_key.length && bucket
        ? `https://${bucket}.s3.${S3_REGION}.amazonaws.com/${file_key}`
        : "";
}
