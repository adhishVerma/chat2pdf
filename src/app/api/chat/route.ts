import { callChain } from "@/lib/langchain";
import { Message } from "ai";
import { storeMessage } from "@/lib/db/store-message";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs";
import { eq } from "drizzle-orm";

const formatMessage = (message: Message) => {
    return `${message.role === 'user' ? "Human" : "Assistant"}: ${message.content}`
}

export const runtime = "edge";

export async function POST(req: Request) {
    const { userId } = auth();
    if (!userId) {
        return Response.json("Unauthorized", { status: 401 })
    }
    const body = await req.json();
    const chatId = body.chatId;
    // the chat must belong to the signed-in user; use its stored file_key
    const chatQuery = await db.select().from(chats).where(eq(chats.id, parseInt(chatId)));
    if (!chatQuery.length || chatQuery[0].userId !== userId) {
        return Response.json("Unauthorized", { status: 401 })
    }
    const file_key = chatQuery[0].file_key;
    const messages: Message[] = body.messages ?? [];
    const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);
    const question = messages[messages.length - 1]?.content;

    if (!question) {
        return Response.json("Error: No question in the request", {
            status: 500,
        })
    }
    try {
        // save the message to db
        const userMessage = messages[messages.length - 1]
        await storeMessage(userMessage, chatId)

        const streamingTextResponse = callChain({
            question,
            chatHistory: formattedPreviousMessages.join("\n"),
            namespace: file_key,
            // save the assistant's reply server-side once the stream finishes
            onFinal: (completion) => storeMessage({ content: completion, role: "assistant" }, chatId),
        });

        return streamingTextResponse;
    } catch (err) {
        console.error("Internal Server error", err);
        return Response.json("Error: Something went wrong. Try again!!", {
            status: 500,
        })
    }
}
