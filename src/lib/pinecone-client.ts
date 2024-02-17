import { Pinecone } from "@pinecone-database/pinecone";
import { env } from "./config";
import { delay } from "./utils"

let pineconeClientInstance: Pinecone | null = null;

async function createIndex(client: Pinecone, indexName: string) {
    try {
        await client.createIndex({
            name: indexName,
            dimension: 8, // Replace with your model dimensions
            metric: 'euclidean', // Replace with your model metric
            spec: {
                serverless: {
                    cloud: 'aws',
                    region: 'us-west-2'
                }
            }
        });
        await delay(env.INDEX_INIT_TIMEOUT);
        console.log("Index Created!!");
    } catch (err) {
        console.error("error", err);
        throw new Error("Index creation failed");
    }
}

async function initPineconeClient() {
    try {
        const pineconeClient = new Pinecone({
            apiKey: env.PINECONE_API_KEY
        })
        const indexName = env.PINECONE_INDEX_NAME;
        const existingIndexes = await pineconeClient.listIndexes();

        if(!existingIndexes.indexes?.includes){
            createIndex(pineconeClient, indexName);
        }else{
            console.log("index already exists");
        }
        return pineconeClient;
    } catch (err) {
        console.error("error", err);
        throw new Error("Pinecone initialization failed");
    }
}

export async function getPineConeClinet() {
    if(!pineconeClientInstance){
        pineconeClientInstance = await initPineconeClient();
    }
    return pineconeClientInstance;
}