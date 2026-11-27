import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { chunkPdf, splitText } from "@/lib/pdf-text";

describe("splitText", () => {
    it("returns nothing for blank text", () => {
        expect(splitText("  \n\t ")).toEqual([]);
    });

    it("keeps short text as one chunk", () => {
        expect(splitText("hello   world")).toEqual(["hello world"]);
    });

    it("splits long text into overlapping chunks of at most 1000 chars", () => {
        const words = Array.from({ length: 800 }, (_, i) => `w${i}`).join(" ");
        const chunks = splitText(words);
        expect(chunks.length).toBeGreaterThan(1);
        for (const c of chunks) expect(c.length).toBeLessThanOrEqual(1000);
        // consecutive chunks share some words
        for (let i = 1; i < chunks.length; i++) {
            const tail = chunks[i - 1].split(" ").slice(-5).join(" ");
            expect(chunks[i]).toContain(tail);
        }
        // nothing is lost
        expect(chunks[0].startsWith("w0 ")).toBe(true);
        expect(chunks[chunks.length - 1].endsWith("w799")).toBe(true);
    });

    it("never cuts a word in half", () => {
        const words = Array.from({ length: 500 }, () => "abcdefgh").join(" ");
        for (const c of splitText(words)) {
            for (const w of c.split(" ")) expect(w).toBe("abcdefgh");
        }
    });
});

describe("chunkPdf", () => {
    it("extracts text with page numbers from the sample PDF", async () => {
        const chunks = await chunkPdf(readFileSync(path.join(__dirname, "../../docs/ipc.pdf")));
        expect(chunks.length).toBeGreaterThan(100);
        const pages = new Set(chunks.map((c) => c.page));
        expect(Math.min(...pages)).toBe(1);
        expect(Math.max(...pages)).toBe(112);
        const conspiracy = chunks.find((c) => c.content.includes("criminal conspiracy"));
        expect(conspiracy?.page).toBeGreaterThan(1);
    });
});
