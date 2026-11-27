// /api/chat/[chatId]/pdf: redirects the owner to a short-lived signed S3 URL for the PDF.
import { and, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { createViewUrl } from "@/lib/s3";

export async function GET(_req: Request, { params }: { params: { chatId: string } }) {
    const session = await getSession();
    const chatId = parseInt(params.chatId);
    if (!session || Number.isNaN(chatId)) {
        return Response.json({ message: "Unauthorized" }, { status: 401 });
    }
    const [chat] = await db.select({ file_key: chats.file_key }).from(chats)
        .where(and(eq(chats.id, chatId), eq(chats.userId, session.userId)));
    if (!chat) {
        return Response.json({ message: "Not found" }, { status: 404 });
    }
    return Response.redirect(await createViewUrl(chat.file_key), 302);
}
