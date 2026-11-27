import { beforeAll, describe, expect, it } from "vitest";
import { getPool } from "@/lib/db";
import { consumeToken, issueToken } from "@/lib/auth/tokens";
import { createUser, hasDatabase, resetDatabase } from "../support/db";

describe.skipIf(!hasDatabase)("one-time auth tokens", () => {
    beforeAll(resetDatabase);

    it("works once, for the right type only", async () => {
        const user = await createUser();
        const token = await issueToken(user.id, "reset_password");
        expect(await consumeToken(token, "verify_email")).toBeNull();
        expect(await consumeToken(token, "reset_password")).toBe(user.id);
        expect(await consumeToken(token, "reset_password")).toBeNull();
    });

    it("stores only a hash", async () => {
        const user = await createUser();
        const token = await issueToken(user.id, "verify_email");
        const { rows } = await getPool().query("SELECT token_hash FROM auth_tokens WHERE user_id = $1", [user.id]);
        expect(rows[0].token_hash).not.toContain(token);
        expect(rows[0].token_hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it("voids older tokens when a new one is issued", async () => {
        const user = await createUser();
        const first = await issueToken(user.id, "verify_email");
        const second = await issueToken(user.id, "verify_email");
        expect(await consumeToken(first, "verify_email")).toBeNull();
        expect(await consumeToken(second, "verify_email")).toBe(user.id);
    });

    it("rejects expired tokens", async () => {
        const user = await createUser();
        const token = await issueToken(user.id, "reset_password");
        await getPool().query("UPDATE auth_tokens SET expires_at = now() - interval '1 minute' WHERE user_id = $1", [user.id]);
        expect(await consumeToken(token, "reset_password")).toBeNull();
    });
});
