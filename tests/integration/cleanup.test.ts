import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPool } from "@/lib/db";
import { createChat, createUser, hasDatabase, resetDatabase } from "../support/db";

// an in-memory stand-in for the bucket
const HOUR = 3600_000;
let objects: { Key: string; LastModified: Date }[] = [];
const deleted: string[] = [];
vi.mock("@/lib/s3", () => ({
    getBucketName: () => "test-bucket",
    getS3Client: () => ({
        listObjectsV2: async ({ ContinuationToken }: { ContinuationToken?: string }) => {
            // two pages, to cover pagination
            const start = ContinuationToken ? 2 : 0;
            return { Contents: objects.slice(start, start + 2), IsTruncated: start + 2 < objects.length, NextContinuationToken: "next" };
        },
        deleteObjects: async ({ Delete }: { Delete: { Objects: { Key: string }[] } }) => {
            deleted.push(...Delete.Objects.map((o) => o.Key));
        },
    }),
}));

const { runCleanup } = await import("@/lib/jobs/cleanup");

describe.skipIf(!hasDatabase)("cleanup job", () => {
    beforeEach(async () => {
        await resetDatabase();
        deleted.length = 0;
    });

    it("deletes old uploads that never became a chat, and keeps the rest", async () => {
        const user = await createUser();
        await createChat(user.id, "uploads/old-in-use.pdf");
        const old = new Date(Date.now() - 48 * HOUR);
        objects = [
            { Key: "uploads/old-in-use.pdf", LastModified: old },
            { Key: "uploads/old-orphan.pdf", LastModified: old },
            { Key: "uploads/new-orphan.pdf", LastModified: new Date() }, // may still become a chat
            { Key: "uploads/old-orphan-2.pdf", LastModified: old },
        ];
        const result = await runCleanup();
        expect(deleted.sort()).toEqual(["uploads/old-orphan-2.pdf", "uploads/old-orphan.pdf"]);
        expect(result?.orphanUploads).toBe(2);
    });

    it("deletes expired and used email tokens, and old rate limit counters", async () => {
        objects = [];
        const user = await createUser();
        const pool = getPool();
        await pool.query(
            `INSERT INTO auth_tokens (user_id, type, token_hash, expires_at, used_at) VALUES
                ($1, 'verify_email', 'expired', now() - interval '2 days', NULL),
                ($1, 'verify_email', 'used', now() + interval '1 day', now() - interval '2 days'),
                ($1, 'reset_password', 'live', now() + interval '1 hour', NULL)`, [user.id]);
        await pool.query(`INSERT INTO rate_limits (key, window_start, count) VALUES
                ('old', now() - interval '3 days', 1), ('fresh', now(), 1)`);

        expect(await runCleanup()).toMatchObject({ authTokens: 2, rateLimits: 1 });
        const tokens = await pool.query("SELECT token_hash FROM auth_tokens");
        expect(tokens.rows.map((r) => r.token_hash)).toEqual(["live"]);
        const limits = await pool.query("SELECT key FROM rate_limits");
        expect(limits.rows.map((r) => r.key)).toEqual(["fresh"]);
    });

    it("runs on one instance at a time", async () => {
        objects = [];
        const results = await Promise.all([runCleanup(), runCleanup(), runCleanup()]);
        expect(results.filter((r) => r !== null).length).toBeGreaterThanOrEqual(1);
        // the lock is released afterwards
        expect(await runCleanup()).not.toBeNull();
    });
});
