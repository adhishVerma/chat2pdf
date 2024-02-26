import { NextRequest, NextResponse } from "next/server";
import { callChain } from "@/lib/langchain";
import { Message } from "ai";
import { storeMessage } from "@/lib/db/store-message";

const formatMessage = (message : Message) => {
    return `${message.role === 'user' ? "Human": "Assistant"}: ${message.content}`
}

export async function POST(req:NextRequest) {
    const body = await req.json();
    const file_key = body.file_key;
    const chatId = body.chatId;
    const messages : Message[] = body.messages ?? [] ;
    const formattedPreviousMessages = messages.slice(0,-1).map(formatMessage);
    const question = messages[messages.length-1].content;

    if(!question){
        return NextResponse.json("Error: No question in the request", {
            status : 500,
        })
    }
    try{
        // save the message to db
        const userMessage = messages[messages.length-1]
        console.log("user asked : ", messages[messages.length-1]);
        storeMessage(userMessage, chatId)
        const streamingTextResponse = callChain({
            question,
            chatHistory : formattedPreviousMessages.join("\n"),
            namespace : file_key
        });
        
        return streamingTextResponse;
    }catch(err){
        console.error("Internal Server error", err);
        return NextResponse.json("Error: Something went wrong. Try again!!", {
            status : 500,
        })
    }
}