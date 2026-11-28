// One-click sign-in to the shared demo account (the "Try the demo" buttons).
import { NextResponse } from "next/server";
import { demoConfig } from "@/lib/demo-config";
import { DEMO_SESSION_SECONDS, ensureDemoUser } from "@/lib/demo";
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/lib/auth/session";
import { LIMITS, checkLimits, clientIp, tooManyRequests } from "@/lib/rate-limit";

export async function POST(req: Request) {
    if (!demoConfig().enabled) {
        return NextResponse.json({ message: "The demo isn't available" }, { status: 404 });
    }
    const limited = await checkLimits([[`sign-in:ip:${clientIp(req)}`, LIMITS.signInPerIp]]);
    if (limited) return tooManyRequests(limited, "Too many sign-in attempts. Please wait a few minutes and try again.");

    const user = await ensureDemoUser();
    if (!user) return NextResponse.json({ message: "The demo isn't available" }, { status: 404 });

    const res = NextResponse.json({ message: "OK" }, { status: 200 });
    res.cookies.set(SESSION_COOKIE,
        await createSessionToken({ userId: user.id, email: user.email, version: user.sessionVersion }, DEMO_SESSION_SECONDS),
        sessionCookieOptions(DEMO_SESSION_SECONDS));
    return res;
}
