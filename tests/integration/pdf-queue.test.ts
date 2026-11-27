import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPool } from "@/lib/db";
import { createChat, createUser, hasDatabase, resetDatabase } from "../support/db";

// processing itself (S3 + OpenAI) is replaced so the queue logic can be tested alone
const processPdf = vi.fn();
vi.mock("@/lib/process-pdf", () => ({ processPdf: (...args: unknown[]) => processPdf(...args) }));

const { claimJob, runJob, retryChat, MAX_ATTEMPTS } = await import("@/lib/jobs/pdf-queue");
const { PermanentJobError } = await import("@/lib/jobs/errors");

async function chatRow(id: number) {
    const { rows } = await getPool().query("SELECT status, attempts, error, next_attempt_at > now() AS delayed FROM chats WHERE id = $1", [id]);
    return rows[0];
}

describe.skipIf(!hasDatabase)("PDF processing queue", () => {
    beforeEach(async () => {
        await resetDatabase();
        processPdf.mockReset();
    });

    it("claims each pending job once", async () => {
        const user = await createUser();
        const ids = [await createChat(user.id), await createChat(user.id)];
        const claimed = await Promise.all([claimJob(), claimJob(), claimJob()]);
        expect(claimed.filter(Boolean).map((j) => j!.id).sort()).toEqual(ids.sort());
        expect((await chatRow(ids[0])).status).toBe("processing");
    });

    it("marks a successful job ready", async () => {
        processPdf.mockResolvedValue({ chunks: 3 });
        const chatId = await createChat((await createUser()).id);
        await runJob((await claimJob())!);
        expect(await chatRow(chatId)).toMatchObject({ status: "ready", attempts: 1, error: null });
    });

    it("retries with backoff, then fails, and can be retried by the user", async () => {
        processPdf.mockRejectedValue(new Error("boom"));
        const chatId = await createChat((await createUser()).id);

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            await getPool().query("UPDATE chats SET next_attempt_at = now() WHERE id = $1", [chatId]);
            const job = await claimJob();
            expect(job?.attempts).toBe(attempt);
            await runJob(job!);
            const row = await chatRow(chatId);
            expect(row.error).toBe("boom");
            expect(row.status).toBe(attempt < MAX_ATTEMPTS ? "pending" : "failed");
            if (attempt < MAX_ATTEMPTS) {
                expect(row.delayed).toBe(true);
                expect(await claimJob()).toBeNull(); // waits for the backoff
            }
        }

        await retryChat(chatId);
        expect(await chatRow(chatId)).toMatchObject({ status: "pending", attempts: 0, error: null });
        expect((await claimJob())?.id).toBe(chatId);
    });

    it("fails at once, without retrying, when the error is permanent", async () => {
        processPdf.mockRejectedValue(new PermanentJobError("No text found in this PDF."));
        const chatId = await createChat((await createUser()).id);
        await runJob((await claimJob())!);
        expect(await chatRow(chatId)).toMatchObject({ status: "failed", attempts: 1, error: "No text found in this PDF." });
        expect(processPdf).toHaveBeenCalledTimes(1);
    });

    it("picks up jobs stuck in processing", async () => {
        const chatId = await createChat((await createUser()).id);
        await claimJob();
        expect(await claimJob()).toBeNull();
        await getPool().query("UPDATE chats SET locked_at = now() - interval '11 minutes' WHERE id = $1", [chatId]);
        expect((await claimJob())?.id).toBe(chatId);
    });
});
