import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPool } from "@/lib/db";
import { createChat, createUser, hasDatabase, resetDatabase } from "../support/db";

const deletedKeys: string[] = [];
vi.mock("@/lib/s3", () => ({ deleteFromS3: async (key: string) => { deletedKeys.push(key); } }));

const { ensureDemoUser, runDemoCleanup } = await import("@/lib/demo");
const { verifyPassword } = await import("@/lib/auth/password");
const { demoConfig } = await import("@/lib/demo-config");

describe.skipIf(!hasDatabase)("demo account", () => {
    beforeEach(async () => {
        await resetDatabase();
        deletedKeys.length = 0;
    });

    it("creates the demo user once, confirmed, with the configured password", async () => {
        const a = await ensureDemoUser();
        const b = await ensureDemoUser();
        expect(a!.id).toBe(b!.id);
        expect(a!.emailVerifiedAt).toBeTruthy();
        expect(await verifyPassword(demoConfig().password, a!.passwordHash)).toBe(true);
    });

    it("puts the configured password back if it was changed", async () => {
        const user = await ensureDemoUser();
        await getPool().query("UPDATE users SET password_hash = 'scrypt:00:00' WHERE id = $1", [user!.id]);
        const fixed = await ensureDemoUser();
        expect(await verifyPassword(demoConfig().password, fixed!.passwordHash)).toBe(true);
    });

    it("deletes demo chats older than 15 minutes, and nobody else's", async () => {
        const demo = await ensureDemoUser();
        const other = await createUser();
        const oldDemo = await createChat(demo!.id, "uploads/demo/old.pdf");
        const newDemo = await createChat(demo!.id, "uploads/demo/new.pdf");
        const oldOther = await createChat(other.id, "uploads/other/old.pdf");
        await getPool().query("UPDATE chats SET created_at = now() - interval '16 minutes' WHERE id = ANY($1)", [[oldDemo, oldOther]]);

        expect(await runDemoCleanup()).toEqual({ deletedChats: 1 });
        const { rows } = await getPool().query<{ id: number }>("SELECT id FROM chats ORDER BY id");
        expect(rows.map((r) => r.id)).toEqual([newDemo, oldOther]);
        expect(deletedKeys).toEqual(["uploads/demo/old.pdf"]);
    });
});
