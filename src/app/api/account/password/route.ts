import { NextResponse } from "next/server";
import z from "zod";
import { getSession } from "@/lib/auth";
import { changePassword, checkPassword } from "@/lib/account";
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/lib/auth/session";
import { LIMITS, checkLimits, tooManyRequests } from "@/lib/rate-limit";

const bodySchema = z.object({
    currentPassword: z.string().min(1).max(200),
    newPassword: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export async function POST(req: Request) {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    if (session.isDemo) return NextResponse.json({ message: "The demo account's password can't be changed" }, { status: 403 });

    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
        return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    const limited = await checkLimits([[`account:password:${session.userId}`, LIMITS.passwordChecksPerUser]]);
    if (limited) return tooManyRequests(limited, "Too many attempts. Please wait a few minutes and try again.");

    if (!(await checkPassword(session.userId, parsed.data.currentPassword))) {
        return NextResponse.json({ message: "Your current password is incorrect" }, { status: 403 });
    }
    const user = await changePassword(session.userId, parsed.data.newPassword);

    // keep this browser signed in; every other session is now invalid
    const res = NextResponse.json({ message: "Password updated" }, { status: 200 });
    res.cookies.set(SESSION_COOKIE, await createSessionToken({ userId: user.id, email: user.email, version: user.sessionVersion }), sessionCookieOptions());
    return res;
}
