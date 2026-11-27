// Postgres + pgvector storage for PDF chunks. Chunks are scoped per chat.
import "server-only";
import { eq } from "drizzle-orm";
import { db, getPool } from "./db";
import { documentChunks } from "./db/schema";
import { embedTexts } from "./openai";

export type Chunk = { content: string; page: number };
export type ScoredChunk = Chunk & { score: number };

const toVector = (v: number[]) => `[${v.join(",")}]`;

export async function storeChunks(chatId: number, chunks: Chunk[]) {
    const vectors = await embedTexts(chunks.map((c) => c.content));
    const rows = chunks.map((c, i) => ({
        chatId,
        content: c.content,
        metadata: { page: c.page },
        embedding: vectors[i],
    }));
    for (let i = 0; i < rows.length; i += 100) {
        await db.insert(documentChunks).values(rows.slice(i, i + 100));
    }
}

export async function searchChunks(chatId: number, query: string, k = 4): Promise<ScoredChunk[]> {
    const [embedding] = await embedTexts([query]);
    const { rows } = await getPool().query<{ content: string; metadata: { page?: number }; distance: number }>(
        `SELECT content, metadata, embedding <=> $1::vector AS distance
           FROM document_chunks
          WHERE chat_id = $2
          ORDER BY distance
          LIMIT $3`,
        [toVector(embedding), chatId, k],
    );
    return rows.map((r) => ({ content: r.content, page: r.metadata?.page ?? 0, score: 1 - Number(r.distance) }));
}

export async function deleteChatChunks(chatId: number) {
    await db.delete(documentChunks).where(eq(documentChunks.chatId, chatId));
}
