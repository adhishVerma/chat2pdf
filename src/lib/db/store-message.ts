import { db } from "."
import { messages } from "./schema"


type Message = {
    content: string;
    role: any
}

export async function storeMessage(message: Message, chatId: string) {
    const { content, role } = message
    if (content && content.length) {
        await db.insert(messages).values({
            chatId: parseInt(chatId),
            content: content ? content : '',
            role: role ? role : '',
        })
    }
}