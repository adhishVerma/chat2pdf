import { NextResponse } from "next/server";
import z from "zod";
import { getSession } from "@/lib/auth";
import { checkPassword, deleteAccount } from "@/lib/account";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { LIMITS, checkLimits, tooManyRequests } from "@/lib/rate-limit";

const bodySchema = z.object({ password: z.string().min(1).max(200) });

// Deletes the signed-in user's account and all of their PDFs. Needs the password.
export async function DELETE(req: Request) {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ message: "Enter your password to confirm" }, { status: 400 });

    const limited = await checkLimits([[`account:password:${session.userId}`, LIMITS.passwordChecksPerUser]]);
    if (limited) return tooManyRequests(limited, "Too many attempts. Please wait a few minutes and try again.");

    if (!(await checkPassword(session.userId, parsed.data.password))) {
        return NextResponse.json({ message: "Your password is incorrect" }, { status: 403 });
    }
    const { deletedPdfs } = await deleteAccount(session.userId);
    console.log(`[account] deleted user ${session.userId} and ${deletedPdfs} PDFs`);

    const res = NextResponse.json({ message: "Account deleted" }, { status: 200 });
    res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
    return res;
}
