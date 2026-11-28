import { eq } from "drizzle-orm";
import z from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { recentMessages, storeMessage } from "@/lib/db/store-message";
import { MAX_HISTORY_TURNS, answerQuestion } from "@/lib/rag";
import { LIMITS, checkLimits } from "@/lib/rate-limit";
import { checkChatBudget } from "@/lib/usage";

const bodySchema = z.object({
    chatId: z.coerce.number().int().positive(),
    question: z.string().trim().min(1).max(4000),
});

// Response body: one line of JSON with the sources used, then the answer text
// streamed as it is generated.
export async function POST(req: Request) {
    const session = await getSession();
    if (!session) {
        return new Response("Unauthorized", { status: 401 });
    }
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
        return new Response("Invalid request", { status: 400 });
    }
    const { chatId, question } = parsed.data;

    // the chat must belong to the signed-in user
    const [chat] = await db.select().from(chats).where(eq(chats.id, chatId));
    if (!chat || chat.userId !== session.userId) {
        return new Response("Unauthorized", { status: 401 });
    }
    if (chat.status !== "ready") {
        return new Response(chat.status === "failed"
            ? "We couldn't process this PDF. Use Retry to try again."
            : "Your PDF is still being processed. Try again in a moment.", { status: 409 });
    }

    // the rate limits and the daily budget are independent checks; run them together
    const [limited, overBudget] = await Promise.all([
        checkLimits([
            [`chat:minute:${session.userId}`, LIMITS.chatPerUserMinute],
            [`chat:day:${session.userId}`, LIMITS.chatPerUserDay],
        ]),
        checkChatBudget(session.userId),
    ]);
    if (limited) {
        return new Response("You're sending messages too quickly. Please wait a moment and try again.", {
            status: 429,
            headers: { "Retry-After": String(limited.retryAfterSeconds) },
        });
    }
    if (overBudget) {
        return new Response("You've reached today's usage limit. It resets at midnight UTC.", {
            status: 429,
            headers: { "Retry-After": String(overBudget.retryAfterSeconds) },
        });
    }

    try {
        // history comes from the database, never from the request body
        // read the history before saving the new question, then save it while
        // retrieval runs instead of waiting for the insert first
        const history = await recentMessages(chatId, MAX_HISTORY_TURNS);
        const [, { sources, stream }] = await Promise.all([
            storeMessage({ content: question, role: "user" }, chatId),
            answerQuestion(chatId, session.userId, history, question),
        ]);

        const encoder = new TextEncoder();
        let answer = "";
        const body = new ReadableStream<Uint8Array>({
            async start(controller) {
                controller.enqueue(encoder.encode(JSON.stringify(
                    sources.map((s) => ({ content: s.content, page: s.page })),
                ) + "\n"));
                try {
                    for await (const delta of stream) {
                        answer += delta;
                        controller.enqueue(encoder.encode(delta));
                    }
                    controller.close();
                } catch (err) {
                    console.error("Streaming failed", err);
                    controller.error(err);
                } finally {
                    if (answer) await storeMessage({ content: answer, role: "assistant" }, chatId);
                }
            },
        });

        return new Response(body, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-store",
            },
        });
    } catch (err) {
        console.error("Internal Server error", err);
        return new Response("Error: Something went wrong. Try again!!", { status: 500 });
    }
}
