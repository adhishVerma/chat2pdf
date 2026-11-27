// Postgres + pgvector vector store (replaces Pinecone). Chunks are scoped per chat.
import "server-only";
import { Document } from "@langchain/core/documents";
import { VectorStore } from "@langchain/core/vectorstores";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { OpenAIEmbeddings } from "@langchain/openai";
import { eq } from "drizzle-orm";
import { db, getPool } from "./db";
import { documentChunks } from "./db/schema";

function getEmbeddings() {
    return new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY });
}

const toVector = (v: number[]) => `[${v.join(",")}]`;

export class PgChatVectorStore extends VectorStore {
    constructor(embeddings: EmbeddingsInterface, private chatId: number) {
        super(embeddings, {});
    }

    _vectorstoreType() {
        return "pgvector-chat";
    }

    async addVectors(vectors: number[][], documents: Document[]) {
        const rows = documents.map((doc, i) => ({
            chatId: this.chatId,
            content: doc.pageContent,
            metadata: doc.metadata ?? {},
            embedding: vectors[i],
        }));
        // insert in batches to keep statements a reasonable size
        for (let i = 0; i < rows.length; i += 100) {
            await db.insert(documentChunks).values(rows.slice(i, i + 100));
        }
    }

    async addDocuments(documents: Document[]) {
        const vectors = await this.embeddings.embedDocuments(documents.map((d) => d.pageContent));
        await this.addVectors(vectors, documents);
    }

    async similaritySearchVectorWithScore(query: number[], k: number): Promise<[Document, number][]> {
        const { rows } = await getPool().query<{ content: string; metadata: Record<string, any>; distance: number }>(
            `SELECT content, metadata, embedding <=> $1::vector AS distance
               FROM document_chunks
              WHERE chat_id = $2
              ORDER BY distance
              LIMIT $3`,
            [toVector(query), this.chatId, k],
        );
        return rows.map((r) => [new Document({ pageContent: r.content, metadata: r.metadata }), 1 - Number(r.distance)]);
    }
}

export async function embedAndStoreDocs(docs: Document[], chatId: number) {
    await new PgChatVectorStore(getEmbeddings(), chatId).addDocuments(docs);
}

export function getVectorStore(chatId: number) {
    return new PgChatVectorStore(getEmbeddings(), chatId);
}

export async function deleteChatChunks(chatId: number) {
    await db.delete(documentChunks).where(eq(documentChunks.chatId, chatId));
}
