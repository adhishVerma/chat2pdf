import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";;
import { downloadFroms3 } from "./s3-server";

export async function getChunkedDocsFromPDF(file_key : string) {
    try{
        // download the pdf from the source and chunk it
        const file_name = await downloadFroms3(file_key);
        if(!file_name){
            throw new Error("couldn't get teh file from s3");
        }
        const loader = new PDFLoader(file_name);
        const docs = await loader.load();

        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize : 1000,
            chunkOverlap : 200,
        });
        
        const chunkedDocs = await textSplitter.splitDocuments(docs);
        return chunkedDocs;

    }catch(err){
        console.error("error",err);
        throw new Error("PDF docs chunking failed");
    }
}



