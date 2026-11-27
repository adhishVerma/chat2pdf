// Retrieval-augmented answers over a chat's PDF chunks.
import "server-only";
import { CHAT_MODEL, getOpenAI } from "./openai";
import { QA_SYSTEM_PROMPT, STANDALONE_QUESTION_PROMPT } from "./prompt-templates";
import { searchChunks, type ScoredChunk } from "./vector-store";
import { recordUsage, tokensFrom, type UsageContext } from "./usage";

export type ChatTurn = { role: "user" | "assistant"; content: string };

export const MAX_HISTORY_TURNS = 10;

async function standaloneQuestion(history: ChatTurn[], question: string, usage: UsageContext) {
    if (!history.length) return question;
    const transcript = history
        .slice(-MAX_HISTORY_TURNS)
        .map((m) => `${m.role === "user" ? "Human" : "Assistant"}: ${m.content}`)
        .join("\n");
    const res = await getOpenAI().chat.completions.create({
        model: CHAT_MODEL,
        temperature: 0,
        messages: [
            { role: "system", content: STANDALONE_QUESTION_PROMPT },
            { role: "user", content: `Conversation:\n${transcript}\n\nFollow-up question: ${question}` },
        ],
    });
    await recordUsage(usage, "rewrite", CHAT_MODEL, tokensFrom(res.usage));
    return res.choices[0]?.message?.content?.trim() || question;
}

// Finds the relevant chunks and returns them with a stream of answer text.
export async function answerQuestion(chatId: number, userId: string, history: ChatTurn[], question: string): Promise<{
    sources: ScoredChunk[];
    stream: AsyncIterable<string>;
}> {
    const usage: UsageContext = { userId, chatId };
    const query = await standaloneQuestion(history, question, usage);
    const sources = await searchChunks(chatId, query, 4, usage);
    const context = sources.map((s) => `[p. ${s.page}]\n${s.content}`).join("\n\n---\n\n");

    const completion = await getOpenAI().chat.completions.create({
        model: CHAT_MODEL,
        temperature: 0.1,
        stream: true,
        // the last chunk then carries the token counts
        stream_options: { include_usage: true },
        messages: [
            { role: "system", content: QA_SYSTEM_PROMPT.replace("{context}", context) },
            ...history.slice(-MAX_HISTORY_TURNS),
            { role: "user", content: question },
        ],
    });

    async function* text() {
        for await (const chunk of completion) {
            if (chunk.usage) await recordUsage(usage, "answer", CHAT_MODEL, tokensFrom(chunk.usage));
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) yield delta;
        }
    }
    return { sources, stream: text() };
}
