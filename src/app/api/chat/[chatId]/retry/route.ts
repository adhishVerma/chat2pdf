// POST /api/chat/[chatId]/retry: re-queues a chat whose PDF processing failed.
import { and, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { retryChat } from "@/lib/jobs/pdf-queue";
import { wakeWorker } from "@/lib/jobs/worker";
import { LIMITS, checkLimits, tooManyRequests, limitSubject } from "@/lib/rate-limit";

export async function POST(req: Request, { params }: { params: Promise<{ chatId: string }> }) {
    const session = await getSession();
    const chatId = parseInt((await params).chatId);
    if (!session || Number.isNaN(chatId)) {
        return Response.json({ message: "Unauthorized" }, { status: 401 });
    }
    const [chat] = await db.select({ status: chats.status }).from(chats)
        .where(and(eq(chats.id, chatId), eq(chats.userId, session.userId)));
    if (!chat) {
        return Response.json({ message: "Not found" }, { status: 404 });
    }
    if (chat.status !== "failed") {
        return Response.json({ message: "Only failed chats can be retried" }, { status: 409 });
    }
    const limited = await checkLimits([[`retry:${limitSubject(session, req)}`, LIMITS.retriesPerUserHour]]);
    if (limited) return tooManyRequests(limited, "Too many retries. Please try again later.");
    await retryChat(chatId);
    wakeWorker();
    return Response.json({ message: "OK" }, { status: 200 });
}
