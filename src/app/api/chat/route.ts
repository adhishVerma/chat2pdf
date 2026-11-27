import { callChain } from "@/lib/langchain";
import { Message } from "ai";
import { storeMessage } from "@/lib/db/store-message";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

const formatMessage = (message: Message) => {
    return `${message.role === 'user' ? "Human" : "Assistant"}: ${message.content}`
}

export async function POST(req: Request) {
    const session = await getSession();
    if (!session) {
        return Response.json("Unauthorized", { status: 401 })
    }
    const body = await req.json();
    const chatId = body.chatId;
    // the chat must belong to the signed-in user
    const chatQuery = await db.select().from(chats).where(eq(chats.id, parseInt(chatId)));
    if (!chatQuery.length || chatQuery[0].userId !== session.userId) {
        return Response.json("Unauthorized", { status: 401 })
    }
    if (!chatQuery[0].processed) {
        return new Response("Your PDF is still being processed. Try again in a moment.", { status: 409 })
    }
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
            chatId: chatQuery[0].id,
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
