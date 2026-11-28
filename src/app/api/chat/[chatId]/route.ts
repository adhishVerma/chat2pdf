import { db } from "@/lib/db";
import { deleteChat } from "@/lib/db/delete-chat";
import { chats, messages } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { and, asc, eq } from "drizzle-orm";
import z from "zod";

export async function GET(req: Request, context: { params: Promise<{ chatId: string }> }) {
    try {
        const session = await getSession()
        const userId = session?.userId
        let chat;
        const chatId = parseInt((await context.params).chatId)
        if (Number.isNaN(chatId)) {
            return Response.json({ "status": "failed" }, { status: 400 })
        }
        const chatQuery = await db.select().from(chats).where(eq(chats.id, chatId));
        if (chatQuery.length) {
            chat = chatQuery[0]
        }
        if (!userId || !chat || chat.userId !== userId) {
            return Response.json({ "status": "Unauthorized" }, {
                status: 401
            })
        }
        const _messages = await db.select().from(messages).where(eq(messages.chatId, chatId)).orderBy(asc(messages.id));
        return Response.json({ "messages": _messages, "file_key": chat.file_key, "processing": { "status": chat.status, "error": chat.error, "attempts": chat.attempts }, "status": "success" }, {
            status: 200
        })
    } catch (err) {
        console.log("Error fetching messages from DB", err);
        return Response.json({ "status": "failed" }, {
            status: 502
        })
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ chatId: string }> }) {
    const session = await getSession();
    if (!session) {
        return Response.json({ "status": "Unauthorized" }, { status: 401 })
    }
    const chatId = parseInt((await params).chatId);
    if (Number.isNaN(chatId)) {
        return Response.json({ "status": "failed" }, { status: 400 })
    }
    // only the owner of a chat may delete it
    const chatQuery = await db.select().from(chats).where(eq(chats.id, chatId));
    if (!chatQuery.length || chatQuery[0].userId !== session.userId) {
        return Response.json({ "status": "Unauthorized" }, { status: 401 })
    }
    const result = await deleteChat(chatId);
    if (result?.message === 'success') {
        return Response.json({
            "status": "success"
        }, { status: 200 })
    }
    return Response.json({
        'status': 'failed'
    }, { status: 500 })
}

const renameSchema = z.object({
    // empty or blank resets to the PDF's file name
    title: z.string().max(120).transform((t) => t.replace(/\s+/g, " ").trim()),
});

// Renames a chat. Body: { "title": "..." }; an empty title goes back to the file name.
export async function PATCH(req: Request, { params }: { params: Promise<{ chatId: string }> }) {
    const session = await getSession();
    if (!session) {
        return Response.json({ message: "Unauthorized" }, { status: 401 });
    }
    const chatId = parseInt((await params).chatId);
    if (Number.isNaN(chatId)) {
        return Response.json({ message: "Invalid chat" }, { status: 400 });
    }
    const parsed = renameSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
        return Response.json({ message: "Names can be up to 120 characters" }, { status: 400 });
    }
    const title = parsed.data.title || null;
    const [chat] = await db.update(chats).set({ title })
        .where(and(eq(chats.id, chatId), eq(chats.userId, session.userId)))
        .returning({ id: chats.id, title: chats.title, pdfName: chats.pdfName });
    if (!chat) {
        return Response.json({ message: "Not found" }, { status: 404 });
    }
    return Response.json({ id: chat.id, title: chat.title, name: chat.title ?? chat.pdfName }, { status: 200 });
}
