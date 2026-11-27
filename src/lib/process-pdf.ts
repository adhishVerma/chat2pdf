// Downloads an uploaded PDF from S3, chunks it, embeds the chunks into Postgres
// and marks the chat as processed. Replaces the external AWS Lambda.
import "server-only";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { chats } from "./db/schema";
import { getChunkedDocsFromPDF } from "./pdf-loader";
import { deleteChatChunks, embedAndStoreDocs } from "./vector-store";

export async function processPdf(chatId: number, fileKey: string) {
    const docs = await getChunkedDocsFromPDF(fileKey);
    // re-running is safe: replace any chunks from a previous attempt
    await deleteChatChunks(chatId);
    await embedAndStoreDocs(docs, chatId);
    await db.update(chats).set({ processed: true }).where(eq(chats.id, chatId));
    return { chunks: docs.length };
}
