import { describe, expect, it } from "vitest";
import { linkPageRefs, nameChecker } from "@/lib/utils";

describe("linkPageRefs", () => {
    it("links page mentions", () => {
        expect(linkPageRefs("See (p. 4) and pp.12.")).toBe("See ([p. 4](#page=4)) and [pp.12](#page=12).");
    });
    it("leaves other text alone", () => {
        expect(linkPageRefs("help. 4 apples, step 2")).toBe("help. 4 apples, step 2");
    });
});

describe("nameChecker", () => {
    it("accepts printable ASCII names", () => {
        expect(nameChecker("report-2024 (final).pdf")).toBe(true);
    });
    it("rejects control and non-ASCII characters", () => {
        expect(nameChecker("bad\u0007.pdf")).toBe(false);
        expect(nameChecker("résumé.pdf")).toBe(false);
    });
});
