import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { unlink } from "fs/promises";
import { downloadFroms3 } from "./s3-server";

export async function getChunkedDocsFromPDF(file_key: string) {
    // download the pdf from S3 to a temp file and chunk it
    const file_name = await downloadFroms3(file_key);
    try {
        const loader = new PDFLoader(file_name);
        const docs = await loader.load();

        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1024,
            chunkOverlap: 200,
        });

        return await textSplitter.splitDocuments(docs);
    } catch (err) {
        console.error("error", err);
        throw new Error("PDF docs chunking failed");
    } finally {
        await unlink(file_name).catch(() => undefined);
    }
}
