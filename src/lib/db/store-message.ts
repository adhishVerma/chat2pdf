import "server-only";
import { db } from "."
import { messages } from "./schema"

type Message = {
    content: string;
    role: "user" | "assistant"
}

export async function storeMessage(message: Message, chatId: number | string) {
    const { content, role } = message
    if (content && content.length) {
        await db.insert(messages).values({
            chatId: typeof chatId === "number" ? chatId : parseInt(chatId),
            content,
            role,
        })
    }
}
