import "server-only";
import { desc, eq } from "drizzle-orm";
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

// The latest messages of a chat, oldest first. The server builds the model's
// conversation from these, so a client can't send in turns that never happened.
export async function recentMessages(chatId: number, limit: number) {
    const rows = await db
        .select({ role: messages.role, content: messages.content })
        .from(messages)
        .where(eq(messages.chatId, chatId))
        .orderBy(desc(messages.createdAt), desc(messages.id))
        .limit(limit);
    return rows.reverse();
}
