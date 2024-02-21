import { ConversationalRetrievalQAChain } from "langchain/chains";
import { getVectorStore } from "./vector-store";
import { getPineconeClient } from "./pinecone-client";
import { StreamingTextResponse, LangChainStream, experimental_StreamData } from "ai"
import { streamingModel, nonStreamingModel } from "./llm";
import { STANDALONE_QUESTION_TEMPLATE, QA_TEMPLATE } from "./prompt-templates";

type callChainArgs = {
    question: string;
    chatHistory: string;
}

export async function callChain({ question, chatHistory }: callChainArgs) {
    try {
        const sanitizedQuestion = question.trim().replaceAll("\n", " ");
        const pineconeClient = await getPineconeClient();
        const vectorStore = await getVectorStore(pineconeClient);
        const { stream, handlers } = LangChainStream({
            experimental_streamData : true,
        });
        const data = new experimental_StreamData();

        const chain = ConversationalRetrievalQAChain.fromLLM(
            streamingModel,
            vectorStore.asRetriever(),
            {
                qaTemplate: QA_TEMPLATE,
                questionGeneratorTemplate: STANDALONE_QUESTION_TEMPLATE,
                questionGeneratorChainOptions: {
                    llm: nonStreamingModel,
                },
                returnSourceDocuments: true,
            }
        );

        chain.invoke({
            question: sanitizedQuestion,
            chat_history: chatHistory, handlers
        }, { callbacks: [handlers] }).then(async (res) => {
            const sourceDocuments = res?.sourceDocuments;
            const firstTwoDocuments = sourceDocuments.slice(0,2);
            const pageContents = firstTwoDocuments.map(({pageContent}: {pageContent:string}) => pageContent);
            data.append({
                sources : pageContents
            });
            data.close();
        })

        return new StreamingTextResponse(stream, {} , data);

    } catch (err) {
        console.error("error", err);
        throw new Error("Failed callChain")
    }
}