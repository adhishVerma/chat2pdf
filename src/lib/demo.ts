// Server side of the shared demo account (see demo-config.ts).
import "server-only";
import { randomUUID } from "crypto";
import { and, eq, sql } from "drizzle-orm";
import { db, getPool } from "./db";
import { chats, users } from "./db/schema";
import { hashPassword, verifyPassword } from "./auth/password";
import { deleteChat } from "./db/delete-chat";
import { DEMO_TTL_MINUTES, demoConfig } from "./demo-config";

export const DEMO_SESSION_SECONDS = DEMO_TTL_MINUTES * 60;
const LOCK_ID = 7_302_146; // shared by all instances; differs from the hourly cleanup's

// Creates the demo user if it's missing, and keeps its password in line with
// the configured one. It never needs email confirmation.
export async function ensureDemoUser() {
    const cfg = demoConfig();
    if (!cfg.enabled) return null;
    const [existing] = await db.select().from(users).where(eq(users.email, cfg.email));
    if (existing) {
        if (!existing.emailVerifiedAt || !(await verifyPassword(cfg.password, existing.passwordHash))) {
            const [updated] = await db.update(users)
                .set({ passwordHash: await hashPassword(cfg.password), emailVerifiedAt: existing.emailVerifiedAt ?? new Date() })
                .where(eq(users.id, existing.id)).returning();
            return updated;
        }
        return existing;
    }
    const [created] = await db.insert(users).values({
        id: randomUUID(),
        email: cfg.email,
        passwordHash: await hashPassword(cfg.password),
        emailVerifiedAt: new Date(),
    }).onConflictDoNothing().returning();
    // another instance may have created it at the same moment
    return created ?? (await db.select().from(users).where(eq(users.email, cfg.email)))[0];
}

// Deletes demo chats (and their PDFs in S3) older than DEMO_TTL_MINUTES.
// The age is compared in SQL, so it doesn't depend on the app's time zone.
// Run every minute by the worker; the advisory lock keeps instances from overlapping.
export async function runDemoCleanup(): Promise<{ deletedChats: number } | null> {
    const cfg = demoConfig();
    if (!cfg.enabled) return null;
    const client = await getPool().connect();
    try {
        const { rows } = await client.query<{ ok: boolean }>("SELECT pg_try_advisory_lock($1) AS ok", [LOCK_ID]);
        if (!rows[0].ok) return null;
        try {
            const expired = await db.select({ id: chats.id }).from(chats)
                .innerJoin(users, eq(users.id, chats.userId))
                .where(and(eq(users.email, cfg.email), sql`${chats.createdAt} < now() - make_interval(mins => ${DEMO_TTL_MINUTES})`));
            for (const { id } of expired) await deleteChat(id);
            return { deletedChats: expired.length };
        } finally {
            await client.query("SELECT pg_advisory_unlock($1)", [LOCK_ID]);
        }
    } finally {
        client.release();
    }
}
