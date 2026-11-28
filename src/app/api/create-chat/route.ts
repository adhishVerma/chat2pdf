// /api/create-chat
// Saves a chat for a PDF the user just uploaded through /api/upload-url.

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import z from "zod";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { wakeWorker } from "@/lib/jobs/worker";
import { userUploadPrefix } from "@/lib/s3";
import { LIMITS, checkLimits, tooManyRequests, limitSubject } from "@/lib/rate-limit";

const bodySchema = z.object({
    file_key: z.string().min(1).max(1024),
    file_name: z.string().trim().min(1).max(200),
});

export async function POST(req: Request) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
        return NextResponse.json({ message: "Invalid file" }, { status: 400 });
    }
    const { file_key, file_name } = parsed.data;

    // the key must be one we issued to this user, and not already used by a chat;
    // otherwise someone could open (or delete) another user's PDF by its key
    if (!file_key.startsWith(userUploadPrefix(session.userId)) || file_key.includes("..")) {
        return NextResponse.json({ message: "Invalid file" }, { status: 403 });
    }
    const limited = await checkLimits([[`create-chat:${limitSubject(session, req)}`, LIMITS.chatsCreatedPerUserHour]]);
    if (limited) return tooManyRequests(limited, "You've reached the upload limit. Please try again later.");
    try {
        const existing = await db.select({ id: chats.id }).from(chats).where(eq(chats.file_key, file_key));
        if (existing.length) {
            return NextResponse.json({ message: "This file already has a chat" }, { status: 409 });
        }
        const [chat] = await db.insert(chats).values({
            file_key,
            pdfName: file_name,
            pdfUrl: `s3://${process.env.S3_BUCKET_NAME}/${file_key}`,
            userId: session.userId,
        }).returning({ id: chats.id });
        // the chat starts as "pending"; the queue worker picks it up
        wakeWorker();
        return Response.json({ message: "OK", chat_id: chat.id }, { status: 200 });
    } catch (err) {
        console.error("Failed to create chat", err);
        return NextResponse.json({ message: "internal server error" }, { status: 500 });
    }
}
