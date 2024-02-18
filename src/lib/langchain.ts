import { ConversationalRetrievalQAChain } from "langchain/chains";
import { getVectorStore } from "./vector-store";
import { getPineconeClient } from "./pinecone-client";
import { StreamingTextResponse, experimental_StreamData, LangChainStream } from "ai"
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
        const { stream, handlers } = LangChainStream();
        const chain = ConversationalRetrievalQAChain.fromLLM(
            streamingModel,
            vectorStore.asRetriever(),
            {
                qaTemplate: QA_TEMPLATE,
                questionGeneratorTemplate: STANDALONE_QUESTION_TEMPLATE,
                returnSourceDocuments: true,
                questionGeneratorChainOptions: {
                    llm: nonStreamingModel,
                }
            }
        );

        chain.invoke({
            question: sanitizedQuestion,
            chat_history: chatHistory,handlers
        }, { callbacks: [handlers] })

        return new StreamingTextResponse(stream)

    } catch (err) {
        console.error("error", err);
        throw new Error("Failed callChain")
    }
}