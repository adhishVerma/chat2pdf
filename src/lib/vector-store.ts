import { env } from "./config";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
import { convertToAscii } from "./utils";
import { getPineconeClient } from "./pinecone-client";

export async function embedAndStoreDocs(
    client: Pinecone,
    // @ts-ignore docs type error
    docs: Document<Record<string, any>>[],
    namespace: string
) {
    try {
        const embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY
        });
        const index = client.Index(env.PINECONE_INDEX_NAME);

        // embed the pdf documents
        await PineconeStore.fromDocuments(docs, embeddings, {
            pineconeIndex: index,
            namespace: convertToAscii(namespace),
            textKey: "text"
        })
    } catch (err) {
        console.error("error", err);
        throw new Error("Failed embedding and storing docs")
    }
}

export async function getVectorStore(client: Pinecone, namespace: string) {
    try {
        const embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY
        }); //LLM
        const index = client.Index(env.PINECONE_INDEX_NAME);

        const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
            pineconeIndex: index,
            textKey: "text",
            namespace: convertToAscii(namespace),
        });

        return vectorStore
    } catch (err) {
        console.error("error", err);
        throw new Error("Something went wrong while getting vector store");
    }

}

export async function dropNamespace(namespace: string){
    const client = await getPineconeClient();
    const index = client.Index(env.PINECONE_INDEX_NAME);
    await index.namespace(namespace).deleteAll();
    return null;
}

