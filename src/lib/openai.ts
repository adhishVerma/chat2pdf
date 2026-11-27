import "server-only";
import OpenAI from "openai";
import { recordUsage, tokensFrom, type UsageContext } from "./usage";

// Override with env vars if you want a different model.
export const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";
// Must produce 1536-dimension vectors to match the document_chunks.embedding column.
export const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";

let client: OpenAI | null = null;

// Created on first use so `next build` works without OPENAI_API_KEY.
export function getOpenAI() {
    client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return client;
}

// Pass `usage` to record the tokens against a user.
export async function embedTexts(texts: string[], usage?: UsageContext): Promise<number[][]> {
    const out: number[][] = [];
    // the embeddings endpoint accepts batches; keep them modest
    for (let i = 0; i < texts.length; i += 100) {
        const res = await getOpenAI().embeddings.create({ model: EMBEDDING_MODEL, input: texts.slice(i, i + 100) });
        out.push(...res.data.sort((a, b) => a.index - b.index).map((d) => d.embedding));
        if (usage) await recordUsage(usage, "embedding", EMBEDDING_MODEL, tokensFrom(res.usage));
    }
    return out;
}
