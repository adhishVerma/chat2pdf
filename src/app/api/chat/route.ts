import { eq } from "drizzle-orm";
import z from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { storeMessage } from "@/lib/db/store-message";
import { answerQuestion } from "@/lib/rag";

const bodySchema = z.object({
    chatId: z.coerce.number().int().positive(),
    messages: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(20000),
    })).min(1).max(200),
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
    const { chatId, messages } = parsed.data;
    const question = messages[messages.length - 1];
    if (question.role !== "user" || !question.content.trim()) {
        return new Response("Error: No question in the request", { status: 400 });
    }

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

    try {
        await storeMessage({ content: question.content, role: "user" }, chatId);
        const { sources, stream } = await answerQuestion(chatId, messages.slice(0, -1), question.content);

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
