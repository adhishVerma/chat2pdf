// Records OpenAI token usage per user and enforces an optional daily budget
// for chat (answers and question rewrites). Embedding usage is recorded too,
// but uploads are already capped by size and the upload rate limits.
import "server-only";
import { getPool } from "./db";

export type UsageKind = "answer" | "rewrite" | "embedding";
export type UsageContext = { userId: string; chatId?: number | null };
export type TokenCounts = { promptTokens: number; completionTokens: number };

export async function recordUsage(ctx: UsageContext, kind: UsageKind, model: string, tokens: TokenCounts) {
    if (!tokens.promptTokens && !tokens.completionTokens) return;
    try {
        await getPool().query(
            `INSERT INTO openai_usage (user_id, chat_id, kind, model, prompt_tokens, completion_tokens)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [ctx.userId, ctx.chatId ?? null, kind, model, tokens.promptTokens, tokens.completionTokens],
        );
    } catch (err) {
        // usage tracking must never break a request
        console.error("[usage] could not record usage", err);
    }
}

// Tokens per user per UTC day for chat. 0 turns the budget off.
export function dailyChatTokenLimit() {
    const raw = process.env.DAILY_CHAT_TOKEN_LIMIT;
    if (raw === undefined || raw === "") return 200_000;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
}

export type UsageSummary = { chatTokensToday: number; totalTokens30d: number; dailyChatLimit: number };

export async function usageSummary(userId: string): Promise<UsageSummary> {
    const { rows } = await getPool().query<{ today: string; month: string }>(
        `SELECT COALESCE(SUM(prompt_tokens + completion_tokens) FILTER (
                    WHERE kind <> 'embedding' AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'), 0) AS today,
                COALESCE(SUM(prompt_tokens + completion_tokens) FILTER (WHERE created_at >= now() - interval '30 days'), 0) AS month
           FROM openai_usage WHERE user_id = $1 AND created_at >= now() - interval '30 days'`,
        [userId],
    );
    return { chatTokensToday: Number(rows[0].today), totalTokens30d: Number(rows[0].month), dailyChatLimit: dailyChatTokenLimit() };
}

// null when the user may chat; otherwise how long until the budget resets (next UTC midnight)
export async function checkChatBudget(userId: string, now = new Date()): Promise<{ retryAfterSeconds: number } | null> {
    const limit = dailyChatTokenLimit();
    if (!limit) return null;
    const { chatTokensToday } = await usageSummary(userId);
    if (chatTokensToday < limit) return null;
    const midnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
    return { retryAfterSeconds: Math.max(1, Math.ceil((midnight - now.getTime()) / 1000)) };
}

export const tokensFrom = (u?: { prompt_tokens?: number; completion_tokens?: number } | null): TokenCounts => ({
    promptTokens: u?.prompt_tokens ?? 0,
    completionTokens: u?.completion_tokens ?? 0,
});
