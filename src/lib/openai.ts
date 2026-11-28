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
    // the embeddings endpoint accepts batches; keep them modest and send a few
    // at a time, so long PDFs don't wait on one request after another
    const BATCH = 100, PARALLEL = 3;
    const batches: string[][] = [];
    for (let i = 0; i < texts.length; i += BATCH) batches.push(texts.slice(i, i + BATCH));
    const results: number[][][] = new Array(batches.length);
    let next = 0;
    const worker = async () => {
        while (next < batches.length) {
            const n = next++;
            const res = await getOpenAI().embeddings.create({ model: EMBEDDING_MODEL, input: batches[n] });
            results[n] = res.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
            if (usage) await recordUsage(usage, "embedding", EMBEDDING_MODEL, tokensFrom(res.usage));
        }
    };
    await Promise.all(Array.from({ length: Math.min(PARALLEL, batches.length) }, worker));
    return results.flat();
}
