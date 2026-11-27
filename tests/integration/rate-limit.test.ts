import { beforeAll, describe, expect, it } from "vitest";
import { getPool } from "@/lib/db";
import { checkLimits, hit } from "@/lib/rate-limit";
import { hasDatabase, resetDatabase } from "../support/db";

describe.skipIf(!hasDatabase)("rate limits", () => {
    beforeAll(resetDatabase);

    it("allows up to the limit, then blocks with a retry time", async () => {
        const limit = { limit: 3, windowSeconds: 60 };
        const results = [];
        for (let i = 0; i < 4; i++) results.push(await hit("t:basic", limit));
        expect(results.map((r) => r.ok)).toEqual([true, true, true, false]);
        expect(results[3].retryAfterSeconds).toBeGreaterThan(0);
        expect(results[3].retryAfterSeconds).toBeLessThanOrEqual(60);
    });

    it("starts a new window once the old one expires", async () => {
        const limit = { limit: 1, windowSeconds: 60 };
        await hit("t:window", limit);
        expect((await hit("t:window", limit)).ok).toBe(false);
        await getPool().query("UPDATE rate_limits SET window_start = now() - interval '61 seconds' WHERE key = 't:window'");
        expect((await hit("t:window", limit)).ok).toBe(true);
    });

    it("counts concurrent hits exactly", async () => {
        const limit = { limit: 10, windowSeconds: 60 };
        const results = await Promise.all(Array.from({ length: 15 }, () => hit("t:concurrent", limit)));
        expect(results.filter((r) => r.ok)).toHaveLength(10);
    });

    it("checkLimits reports the first exceeded limit", async () => {
        const tight = { limit: 1, windowSeconds: 60 };
        expect(await checkLimits([["t:a", tight], ["t:b", tight]])).toBeNull();
        const blocked = await checkLimits([["t:a", tight], ["t:b", tight]]);
        expect(blocked?.ok).toBe(false);
    });
});
