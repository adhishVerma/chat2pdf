// Downloads an uploaded PDF from S3, chunks it, embeds the chunks into Postgres
// Called by the queue worker (src/lib/jobs), which tracks status and retries.
import "server-only";
import { PermanentJobError } from "./jobs/errors";
import { downloadFromS3 } from "./s3-server";
import { chunkPdf } from "./pdf-text";
import { storeChunks } from "./vector-store";

export async function processPdf(chatId: number, fileKey: string, userId?: string) {
    const file = await downloadFromS3(fileKey);
    let chunks;
    try {
        chunks = await chunkPdf(file);
    } catch (err) {
        // pdf-parse throws on files that aren't valid PDFs; a retry won't change that
        console.error(`[process-pdf] could not read ${fileKey}:`, err);
        throw new PermanentJobError("This file couldn't be read as a PDF. It may be damaged or password-protected.");
    }
    if (!chunks.length) {
        throw new PermanentJobError("No text found in this PDF. Scanned PDFs (images of pages) aren't supported yet.");
    }
    // re-running is safe: storeChunks replaces any chunks from a previous attempt
    await storeChunks(chatId, chunks, userId ? { userId, chatId } : undefined);
    return { chunks: chunks.length };
}
