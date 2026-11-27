import { beforeAll, describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSessionToken, verifySessionToken } from "@/lib/auth/session";

beforeAll(() => {
    process.env.AUTH_SECRET = "unit-test-secret-unit-test-secret-1234";
});

describe("passwords", () => {
    it("verifies the right password and rejects others", async () => {
        const hash = await hashPassword("correct horse");
        expect(hash.startsWith("scrypt:")).toBe(true);
        expect(await verifyPassword("correct horse", hash)).toBe(true);
        expect(await verifyPassword("wrong horse", hash)).toBe(false);
    });

    it("salts each hash", async () => {
        expect(await hashPassword("same")).not.toEqual(await hashPassword("same"));
    });

    it("rejects malformed stored hashes", async () => {
        expect(await verifyPassword("x", "plain-text")).toBe(false);
    });
});

describe("session tokens", () => {
    it("round-trips a session", async () => {
        const token = await createSessionToken({ userId: "u1", email: "a@b.c", version: 3 });
        expect(await verifySessionToken(token)).toEqual({ userId: "u1", email: "a@b.c", version: 3 });
    });

    it("rejects tampered, foreign and missing tokens", async () => {
        const token = await createSessionToken({ userId: "u1", email: "a@b.c", version: 0 });
        const [h, p, s] = token.split(".");
        const forged = Buffer.from(JSON.stringify({ sub: "admin", email: "x@y.z", ver: 0 })).toString("base64url");
        expect(await verifySessionToken(`${h}.${forged}.${s}`)).toBeNull();
        expect(await verifySessionToken(`${h}.${p}.${s.slice(0, -2)}xx`)).toBeNull();
        expect(await verifySessionToken(undefined)).toBeNull();

        process.env.AUTH_SECRET = "a-different-secret-a-different-secret-12";
        expect(await verifySessionToken(token)).toBeNull();
        process.env.AUTH_SECRET = "unit-test-secret-unit-test-secret-1234";
    });

    it("refuses to run with a short secret", async () => {
        process.env.AUTH_SECRET = "short";
        await expect(createSessionToken({ userId: "u", email: "e", version: 0 })).rejects.toThrow(/AUTH_SECRET/);
        process.env.AUTH_SECRET = "unit-test-secret-unit-test-secret-1234";
    });
});
