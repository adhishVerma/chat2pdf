import { ChatOpenAI } from "@langchain/openai";

// Created on first use: ChatOpenAI throws at construction when OPENAI_API_KEY
// is missing, which would otherwise break `next build`.
let streaming: ChatOpenAI | null = null;
let nonStreaming: ChatOpenAI | null = null;

export function getStreamingModel() {
    streaming ??= new ChatOpenAI({
        modelName: "gpt-3.5-turbo",
        streaming: true,
        verbose: true,
        temperature: 0.1
    });
    return streaming;
}

export function getNonStreamingModel() {
    nonStreaming ??= new ChatOpenAI({
        modelName: "gpt-3.5-turbo",
        streaming: false,
        verbose: true,
        temperature: 0
    });
    return nonStreaming;
}
