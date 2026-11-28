// Postgres + pgvector storage and hybrid search for PDF chunks. Chunks are scoped per chat.
import "server-only";
import { eq } from "drizzle-orm";
import { db, getPool } from "./db";
import { documentChunks } from "./db/schema";
import { embedTexts } from "./openai";
import type { UsageContext } from "./usage";

export type Chunk = { content: string; page: number };
export type ScoredChunk = Chunk & { score: number };

const toVector = (v: number[]) => `[${v.join(",")}]`;

export async function storeChunks(chatId: number, chunks: Chunk[], usage?: UsageContext) {
    const vectors = await embedTexts(chunks.map((c) => c.content), usage);
    const rows = chunks.map((c, i) => ({
        chatId,
        content: c.content,
        metadata: { page: c.page },
        embedding: vectors[i],
    }));
    // swap in the new chunks atomically: a re-run never leaves a half-filled
    // or empty index behind, and the slow embedding calls stay outside the transaction
    await db.transaction(async (tx) => {
        await tx.delete(documentChunks).where(eq(documentChunks.chatId, chatId));
        for (let i = 0; i < rows.length; i += 200) {
            await tx.insert(documentChunks).values(rows.slice(i, i + 200));
        }
    });
}

// How many candidates each search contributes before they're merged.
const CANDIDATES = 20;
// Reciprocal rank fusion constant; 60 is the usual choice.
const RRF_K = 60;

// Hybrid search: pgvector similarity finds passages with the same meaning,
// Postgres full-text search finds exact terms (section numbers, names, defined
// words) that embeddings tend to blur. The two rankings are merged with
// reciprocal rank fusion, so a chunk near the top of either list makes the cut.
export async function searchChunks(chatId: number, query: string, k = 4, usage?: UsageContext): Promise<ScoredChunk[]> {
    const [embedding] = await embedTexts([query], usage);
    const { rows } = await getPool().query<{ content: string; metadata: { page?: number }; score: number }>(
        `WITH vec AS (
             SELECT id, row_number() OVER (ORDER BY embedding <=> $1::vector) AS rank
               FROM document_chunks
              WHERE chat_id = $2
              ORDER BY embedding <=> $1::vector
              LIMIT $4
         ), kw AS (
             SELECT id, row_number() OVER (ORDER BY ts_rank_cd(content_tsv, q) DESC) AS rank
               FROM document_chunks, websearch_to_tsquery('english', $5) AS q
              WHERE chat_id = $2 AND content_tsv @@ q
              ORDER BY ts_rank_cd(content_tsv, q) DESC
              LIMIT $4
         )
         SELECT c.content, c.metadata,
                COALESCE(1.0 / ($6 + vec.rank), 0) + COALESCE(1.0 / ($6 + kw.rank), 0) AS score
           FROM vec
           FULL OUTER JOIN kw ON kw.id = vec.id
           JOIN document_chunks c ON c.id = COALESCE(vec.id, kw.id)
          ORDER BY score DESC, c.id
          LIMIT $3`,
        [toVector(embedding), chatId, k, CANDIDATES, query, RRF_K],
    );
    return rows.map((r) => ({ content: r.content, page: r.metadata?.page ?? 0, score: Number(r.score) }));
}

export async function deleteChatChunks(chatId: number) {
    await db.delete(documentChunks).where(eq(documentChunks.chatId, chatId));
}
