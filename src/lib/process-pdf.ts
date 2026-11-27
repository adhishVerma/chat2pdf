// Downloads an uploaded PDF from S3, chunks it, embeds the chunks into Postgres
// Called by the queue worker (src/lib/jobs), which tracks status and retries.
import "server-only";
import { downloadFromS3 } from "./s3-server";
import { chunkPdf } from "./pdf-text";
import { deleteChatChunks, storeChunks } from "./vector-store";

export async function processPdf(chatId: number, fileKey: string) {
    const chunks = await chunkPdf(await downloadFromS3(fileKey));
    if (!chunks.length) {
        throw new Error("No text found in this PDF (scanned PDFs aren't supported)");
    }
    // re-running is safe: replace any chunks from a previous attempt
    await deleteChatChunks(chatId);
    await storeChunks(chatId, chunks);
    return { chunks: chunks.length };
}
