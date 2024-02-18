import { Pinecone } from "@pinecone-database/pinecone";
import { env } from "./config";
import { delay } from "./utils"

let pineconeClientInstance: Pinecone | null = null;

async function createIndex(client: Pinecone, indexName: string) {
    try {
        await client.createIndex({
            name: indexName,
            dimension: 1536, // Replace with your model dimensions
            metric: 'cosine', // Replace with your model metric
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
    // TODO: in case indes isn't ready we will have to find a workaround
    try {
        const pineconeClient = new Pinecone({
            apiKey: env.PINECONE_API_KEY
        })
        const indexName = env.PINECONE_INDEX_NAME;
        const useIndex = await pineConeIndexUp(pineconeClient, indexName)

        if(!useIndex){
            createIndex(pineconeClient, indexName);
        }else{
            console.log("index already exists and is ready");
        }
        return pineconeClient;
    } catch (err) {
        console.error("error", err);
        throw new Error("Pinecone initialization failed");
    }
}

export async function getPineconeClient() {
    if(!pineconeClientInstance){
        pineconeClientInstance = await initPineconeClient();
    }
    return pineconeClientInstance;
}

async function pineConeIndexUp(pineconeClient:Pinecone,index:string){
    try{
        const indexReady = (await pineconeClient.describeIndex(index)).status.ready === true
        return indexReady
    }catch(err){
        // if there is an error then the index wasn't found
        console.log(err);
        return false
    }
}