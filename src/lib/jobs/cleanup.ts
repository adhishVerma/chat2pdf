// Periodic housekeeping, run by the worker about once an hour:
// - deletes uploads in S3 that never became a chat (the browser got an upload
//   URL and PUT the file, but /api/create-chat was never called)
// - deletes expired or used email tokens
// A Postgres advisory lock makes sure only one instance runs it at a time.
import "server-only";
import { getPool } from "../db";
import { getBucketName, getS3Client } from "../s3";

const LOCK_ID = 7_302_145; // any constant shared by all instances
const UPLOAD_PREFIX = "uploads/";
export const ORPHAN_AGE_HOURS = 24;

export type CleanupResult = { orphanUploads: number; authTokens: number; rateLimits: number };

async function deleteOrphanUploads(olderThan: Date) {
    const s3 = getS3Client();
    const Bucket = getBucketName();
    let deleted = 0;
    let ContinuationToken: string | undefined;
    do {
        const page = await s3.listObjectsV2({ Bucket, Prefix: UPLOAD_PREFIX, ContinuationToken });
        ContinuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
        const oldKeys = (page.Contents ?? [])
            .filter((o) => o.Key && o.LastModified && o.LastModified < olderThan)
            .map((o) => o.Key!);
        if (!oldKeys.length) continue;

        const { rows } = await getPool().query<{ file_key: string }>(
            "SELECT file_key FROM chats WHERE file_key = ANY($1)", [oldKeys]);
        const inUse = new Set(rows.map((r) => r.file_key));
        const orphans = oldKeys.filter((k) => !inUse.has(k));
        if (!orphans.length) continue;

        await s3.deleteObjects({ Bucket, Delete: { Objects: orphans.map((Key) => ({ Key })), Quiet: true } });
        deleted += orphans.length;
    } while (ContinuationToken);
    return deleted;
}

export async function runCleanup(now = new Date()): Promise<CleanupResult | null> {
    const client = await getPool().connect();
    try {
        const { rows } = await client.query<{ ok: boolean }>("SELECT pg_try_advisory_lock($1) AS ok", [LOCK_ID]);
        if (!rows[0].ok) return null; // another instance is already on it
        try {
            const tokens = await client.query(
                `DELETE FROM auth_tokens WHERE expires_at < now() - interval '1 day' OR used_at < now() - interval '1 day'`);
            const limits = await client.query(`DELETE FROM rate_limits WHERE window_start < now() - interval '2 days'`);
            const orphanUploads = await deleteOrphanUploads(new Date(now.getTime() - ORPHAN_AGE_HOURS * 3600_000));
            return { orphanUploads, authTokens: tokens.rowCount ?? 0, rateLimits: limits.rowCount ?? 0 };
        } finally {
            await client.query("SELECT pg_advisory_unlock($1)", [LOCK_ID]);
        }
    } finally {
        client.release();
    }
}
