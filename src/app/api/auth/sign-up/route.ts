import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/lib/auth/session";
import { credentialsSchema } from "../credentials";

export async function POST(req: Request) {
    const parsed = credentialsSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
        return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    const { email, password } = parsed.data;

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
    if (existing.length) {
        return NextResponse.json({ message: "An account with this email already exists" }, { status: 409 });
    }

    const id = randomUUID();
    await db.insert(users).values({ id, email, passwordHash: await hashPassword(password) });

    const res = NextResponse.json({ message: "OK" }, { status: 201 });
    res.cookies.set(SESSION_COOKIE, await createSessionToken({ userId: id, email }), sessionCookieOptions());
    return res;
}
