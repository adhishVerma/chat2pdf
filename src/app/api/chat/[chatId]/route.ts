import { db } from "@/lib/db";
import { chats, messages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest, context: { params: any }) {
    try {
        let chat;
        const { chatId } = context.params
        const chatQuery = await db.select().from(chats).where(eq(chats.id, chatId));
        if (chatQuery.length) {
            chat = chatQuery[0]
        }
        const _messages = await db.select().from(messages).where(eq(messages.chatId, chatId));
        return Response.json({ "messages": _messages, "file_key": chat?.file_key, "status": "success" })
    } catch (err) {
        console.log("Error fetching messages from DB", err);
        return Response.json({ "status": "failed" }, {
            status: 502
        })
    }
}