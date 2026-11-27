import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/lib/auth/session";
import { credentialsSchema } from "../credentials";

export async function POST(req: Request) {
    const parsed = credentialsSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
        return NextResponse.json({ message: "Invalid email or password" }, { status: 400 });
    }
    const { email, password } = parsed.data;

    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
        return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    const res = NextResponse.json({ message: "OK" }, { status: 200 });
    res.cookies.set(SESSION_COOKIE, await createSessionToken({ userId: user.id, email: user.email }), sessionCookieOptions());
    return res;
}
