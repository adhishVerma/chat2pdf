import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createChat, createUser, hasDatabase, resetDatabase } from "../support/db";
import { getPool } from "@/lib/db";
import { checkChatBudget, recordUsage, usageSummary } from "@/lib/usage";

describe.skipIf(!hasDatabase)("OpenAI usage tracking", () => {
    beforeEach(async () => {
        await resetDatabase();
    });
    afterEach(() => {
        delete process.env.DAILY_CHAT_TOKEN_LIMIT;
    });

    it("sums chat tokens for today and all tokens for 30 days", async () => {
        const user = await createUser();
        const chatId = await createChat(user.id);
        await recordUsage({ userId: user.id, chatId }, "answer", "m", { promptTokens: 100, completionTokens: 20 });
        await recordUsage({ userId: user.id, chatId }, "rewrite", "m", { promptTokens: 30, completionTokens: 5 });
        await recordUsage({ userId: user.id, chatId }, "embedding", "e", { promptTokens: 1000, completionTokens: 0 });
        // yesterday's chat counts for the month, not for today
        await getPool().query(
            `INSERT INTO openai_usage (user_id, kind, model, prompt_tokens, created_at) VALUES ($1, 'answer', 'm', 500, now() - interval '2 days')`, [user.id]);

        const summary = await usageSummary(user.id);
        expect(summary.chatTokensToday).toBe(155);
        expect(summary.totalTokens30d).toBe(1655);
    });

    it("blocks chat over the daily budget until midnight UTC, and can be turned off", async () => {
        const user = await createUser();
        process.env.DAILY_CHAT_TOKEN_LIMIT = "1000";
        expect(await checkChatBudget(user.id)).toBeNull();

        await recordUsage({ userId: user.id }, "answer", "m", { promptTokens: 900, completionTokens: 100 });
        const noon = new Date();
        noon.setUTCHours(12, 0, 0, 0);
        expect(await checkChatBudget(user.id, noon)).toEqual({ retryAfterSeconds: 12 * 3600 });

        // embeddings don't count toward the chat budget
        const other = await createUser();
        await recordUsage({ userId: other.id }, "embedding", "e", { promptTokens: 50_000, completionTokens: 0 });
        expect(await checkChatBudget(other.id)).toBeNull();

        process.env.DAILY_CHAT_TOKEN_LIMIT = "0";
        expect(await checkChatBudget(user.id)).toBeNull();
    });

    it("keeps usage when a chat is deleted, and drops it with the user", async () => {
        const user = await createUser();
        const chatId = await createChat(user.id);
        await recordUsage({ userId: user.id, chatId }, "answer", "m", { promptTokens: 10, completionTokens: 1 });
        await getPool().query("DELETE FROM chats WHERE id = $1", [chatId]);
        expect((await usageSummary(user.id)).totalTokens30d).toBe(11);
        await getPool().query("DELETE FROM users WHERE id = $1", [user.id]);
        const { rows } = await getPool().query("SELECT count(*)::int AS n FROM openai_usage");
        expect(rows[0].n).toBe(0);
    });
});
