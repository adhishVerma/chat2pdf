import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/lib/auth/session";
import { credentialsSchema } from "../credentials";
import { isDemoEmail } from "@/lib/demo-config";
import { DEMO_SESSION_SECONDS, ensureDemoUser } from "@/lib/demo";
import { LIMITS, checkLimits, clientIp, tooManyRequests } from "@/lib/rate-limit";

// compared against when the email is unknown, so both paths take about as long
const DUMMY_HASH = "scrypt:00000000000000000000000000000000:" + "0".repeat(128);

export async function POST(req: Request) {
    const parsed = credentialsSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
        return NextResponse.json({ message: "Invalid email or password" }, { status: 400 });
    }
    const { email, password } = parsed.data;

    const limited = await checkLimits([
        [`sign-in:ip:${clientIp(req)}`, LIMITS.signInPerIp],
        [`sign-in:email:${email}`, LIMITS.signInPerEmail],
    ]);
    if (limited) {
        return tooManyRequests(limited, "Too many sign-in attempts. Please wait a few minutes and try again.");
    }

    // the demo user is created on first use
    if (isDemoEmail(email)) await ensureDemoUser();
    const [user] = await db.select().from(users).where(eq(users.email, email));
    const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !valid) {
        return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    const res = NextResponse.json({ message: "OK" }, { status: 200 });
    // demo sign-ins end after DEMO_TTL_MINUTES, like the demo's chats
    const maxAge = isDemoEmail(user.email) ? DEMO_SESSION_SECONDS : undefined;
    res.cookies.set(SESSION_COOKIE, await createSessionToken({ userId: user.id, email: user.email, version: user.sessionVersion }, maxAge), sessionCookieOptions(maxAge));
    return res;
}
