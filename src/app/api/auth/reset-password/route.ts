import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import z from "zod";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { consumeToken } from "@/lib/auth/tokens";
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/lib/auth/session";

const bodySchema = z.object({
    token: z.string().min(1).max(100),
    password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export async function POST(req: Request) {
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
        return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    const userId = await consumeToken(parsed.data.token, "reset_password");
    if (!userId) {
        return NextResponse.json({ message: "This reset link is invalid or has expired. Request a new one." }, { status: 400 });
    }
    // new password, and bump the session version so every existing session is signed out;
    // the email was proven by the link, so mark it verified too
    const [user] = await db.update(users).set({
        passwordHash: await hashPassword(parsed.data.password),
        sessionVersion: sql`${users.sessionVersion} + 1`,
        emailVerifiedAt: sql`COALESCE(${users.emailVerifiedAt}, now())`,
    }).where(eq(users.id, userId)).returning({ id: users.id, email: users.email, sessionVersion: users.sessionVersion });

    const res = NextResponse.json({ message: "Password updated" }, { status: 200 });
    res.cookies.set(SESSION_COOKIE, await createSessionToken({ userId: user.id, email: user.email, version: user.sessionVersion }), sessionCookieOptions());
    return res;
}
