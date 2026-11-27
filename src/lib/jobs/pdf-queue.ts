// A small job queue on top of the chats table. Workers claim jobs with
// FOR UPDATE SKIP LOCKED, so several app instances can share it safely.
import "server-only";
import { eq } from "drizzle-orm";
import { db, getPool } from "../db";
import { chats } from "../db/schema";
import { processPdf } from "../process-pdf";
import { isPermanent } from "./errors";

export const MAX_ATTEMPTS = 3;
const STALE_LOCK_MINUTES = 10; // a job "processing" longer than this is assumed dead

type Job = { id: number; file_key: string; attempts: number };

export async function claimJob(): Promise<Job | null> {
    const { rows } = await getPool().query<Job>(
        `UPDATE chats SET status = 'processing', locked_at = now(), attempts = attempts + 1, error = NULL
          WHERE id = (
              SELECT id FROM chats
               WHERE (status = 'pending' AND next_attempt_at <= now())
                  OR (status = 'processing' AND locked_at < now() - interval '${STALE_LOCK_MINUTES} minutes')
               ORDER BY next_attempt_at
               FOR UPDATE SKIP LOCKED
               LIMIT 1)
        RETURNING id, file_key, attempts`,
    );
    return rows[0] ?? null;
}

export async function runJob(job: Job) {
    try {
        const { chunks } = await processPdf(job.id, job.file_key);
        await db.update(chats).set({ status: "ready", lockedAt: null, error: null }).where(eq(chats.id, job.id));
        console.log(`[pdf-queue] chat ${job.id}: ready (${chunks} chunks)`);
    } catch (err: any) {
        const message = String(err?.message ?? err).slice(0, 500);
        // permanent errors (no text, not a PDF, missing file) fail at once
        const lastTry = isPermanent(err) || job.attempts >= MAX_ATTEMPTS;
        // back off 30s, 2m, ... between attempts
        const delaySeconds = 30 * 4 ** (job.attempts - 1);
        await db.update(chats).set({
            status: lastTry ? "failed" : "pending",
            error: message,
            lockedAt: null,
            nextAttemptAt: new Date(Date.now() + delaySeconds * 1000),
        }).where(eq(chats.id, job.id));
        console.error(`[pdf-queue] chat ${job.id}: attempt ${job.attempts} failed${lastTry ? " (giving up)" : ""}:`, message);
    }
}

// Puts a failed chat back in the queue with a fresh set of attempts.
export async function retryChat(chatId: number) {
    await db.update(chats).set({ status: "pending", attempts: 0, error: null, nextAttemptAt: new Date() })
        .where(eq(chats.id, chatId));
}
