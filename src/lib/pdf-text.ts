// Extracts per-page text from a PDF and splits it into overlapping chunks.
import "server-only";
// the package root runs a debug script when imported directly, so load the library file
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import type { Chunk } from "./vector-store";

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

export async function extractPages(data: Buffer): Promise<string[]> {
    const pages: string[] = [];
    await pdfParse(data, {
        // called once per page, in order
        pagerender: async (pageData: any) => {
            const content = await pageData.getTextContent();
            let lastY: number | undefined;
            let text = "";
            for (const item of content.items) {
                if (lastY !== undefined && lastY !== item.transform[5]) text += "\n";
                text += item.str;
                lastY = item.transform[5];
            }
            pages[pageData.pageIndex] = text;
            return text;
        },
    });
    return pages.map((p) => p ?? "");
}

// Splits text at whitespace into ~CHUNK_SIZE pieces that overlap by ~CHUNK_OVERLAP.
export function splitText(text: string): string[] {
    const clean = text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
    if (!clean) return [];
    const chunks: string[] = [];
    let start = 0;
    while (start < clean.length) {
        let end = Math.min(start + CHUNK_SIZE, clean.length);
        if (end < clean.length) {
            const breakAt = clean.lastIndexOf(" ", end);
            if (breakAt > start + CHUNK_SIZE / 2) end = breakAt;
        }
        chunks.push(clean.slice(start, end).trim());
        if (end >= clean.length) break;
        let next = end - CHUNK_OVERLAP;
        const space = clean.indexOf(" ", next);
        if (space !== -1 && space < end) next = space + 1;
        start = Math.max(next, start + 1);
    }
    return chunks.filter(Boolean);
}

export async function chunkPdf(data: Buffer): Promise<Chunk[]> {
    const pages = await extractPages(data);
    return pages.flatMap((text, i) => splitText(text).map((content) => ({ content, page: i + 1 })));
}
