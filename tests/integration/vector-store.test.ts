import { beforeAll, describe, expect, it, vi } from "vitest";
import { createChat, createUser, hasDatabase, resetDatabase } from "../support/db";

// deterministic bag-of-words embeddings instead of OpenAI
vi.mock("@/lib/openai", () => ({
    embedTexts: async (texts: string[]) => texts.map((t) => {
        const v = new Array(1536).fill(0);
        for (const w of t.toLowerCase().split(/\W+/).filter(Boolean)) {
            let h = 0;
            for (const c of w) h = (h * 31 + c.charCodeAt(0)) >>> 0;
            v[h % 1536] += 1;
        }
        v[1535] += 0.001;
        return v;
    }),
}));

const { storeChunks, searchChunks, deleteChatChunks } = await import("@/lib/vector-store");

describe.skipIf(!hasDatabase)("pgvector chunk store", () => {
    let chatA: number;
    let chatB: number;

    beforeAll(async () => {
        await resetDatabase();
        const user = await createUser();
        chatA = await createChat(user.id);
        chatB = await createChat(user.id);
        await storeChunks(chatA, [
            { content: "apples are red fruit", page: 1 },
            { content: "bananas are yellow fruit", page: 2 },
            { content: "criminal conspiracy is an agreement", page: 35 },
        ]);
        await storeChunks(chatB, [{ content: "criminal conspiracy in another document", page: 9 }]);
    });

    it("returns the closest chunks with their pages", async () => {
        const [best] = await searchChunks(chatA, "what is criminal conspiracy", 2);
        expect(best).toMatchObject({ page: 35 });
        expect(best.content).toContain("conspiracy");
    });

    it("only searches the given chat", async () => {
        const results = await searchChunks(chatA, "conspiracy another document", 10);
        expect(results).toHaveLength(3);
        expect(results.every((r) => r.page !== 9)).toBe(true);
    });

    it("deletes a chat's chunks", async () => {
        await deleteChatChunks(chatB);
        expect(await searchChunks(chatB, "anything", 5)).toEqual([]);
    });
});
