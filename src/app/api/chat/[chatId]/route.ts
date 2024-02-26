import { db } from "@/lib/db";
import { chats, messages } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest, context: { params: any }) {
    try {
        const { userId } = auth()
        let chat;
        const { chatId } = context.params
        const chatQuery = await db.select().from(chats).where(eq(chats.id, chatId));
        if (chatQuery.length) {
            chat = chatQuery[0]
        }
        if (chat?.userId != userId) {
            return Response.json({"status" : "redirection needed"}, {
                status : 301
            })
        }
        const _messages = await db.select().from(messages).where(eq(messages.chatId, chatId));
        return Response.json({ "messages": _messages, "file_key": chat?.file_key, "status": "success" }, {
            status : 200
        })
    } catch (err) {
        console.log("Error fetching messages from DB", err);
        return Response.json({ "status": "failed" }, {
            status: 502
        })
    }
}