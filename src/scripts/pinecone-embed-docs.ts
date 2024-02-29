import { getChunkedDocsFromPDF } from "@/lib/pdf-loader";
import { embedAndStoreDocs } from "@/lib/vector-store";
import { getPineconeClient } from "@/lib/pinecone-client";


export const preparePDF = async (file_key : string) => {
    try{
        const pineconeClient = await getPineconeClient();
        console.log("preparing chunks from PDF file");
        const docs = await getChunkedDocsFromPDF(file_key);
        console.log(`loading ${docs.length} chunks into pinecone..`);
        await embedAndStoreDocs(pineconeClient, docs, file_key);
        console.log("data embedded and stored in pine-cone index");
    }catch(err){
        console.error("error", err);
        throw new Error("script failed");
    }
    return {success : true};
}

// (async () => {
//     try{
//         const pineconeClient = await getPineconeClient();
//         console.log("preparing chunks from PDF file");
//         const docs = await getChunkedDocsFromPDF();
//         console.log(`loading ${docs.length} chunks into pinecone..`);
//         await embedAndStoreDocs(pineconeClient, docs);
//         console.log("data embedded and stored in pine-cone index");
//     }catch(err){
//         console.error("error", err);
//         throw new Error("script failed")
//     }
//     return null;
// })();