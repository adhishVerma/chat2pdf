import { env } from "./config";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";

export async function embedAndStoreDocs(
    client:Pinecone,
    // @ts-ignore docs type error
    docs : Document<Record<string,any>>[]
    ) {
        try{
            const embeddings = new OpenAIEmbeddings();
            const index = client.Index(env.PINECONE_INDEX_NAME);

            // embed the pdf documents
            await PineconeStore.fromDocuments(docs, embeddings, {
                pineconeIndex : index,
                namespace : env.PINECONE_NAME_SPACE,
                textKey : "text"
            })
        }catch(err){
            console.error("error", err);
            throw new Error("Failed embedding and storing docs")
        }
    }