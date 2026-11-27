import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { issueToken } from "@/lib/auth/tokens";
import { sendVerificationEmail } from "@/lib/email";
import { LIMITS, checkLimits, tooManyRequests } from "@/lib/rate-limit";

export async function POST() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (session.emailVerified) {
        return NextResponse.json({ message: "Your email is already confirmed" }, { status: 200 });
    }
    const limited = await checkLimits([[`email:verify:${session.userId}`, LIMITS.emailPerUser]]);
    if (limited) {
        return tooManyRequests(limited, "We've sent several emails already. Please check your inbox or try again later.");
    }
    await sendVerificationEmail(session.email, await issueToken(session.userId, "verify_email"));
    return NextResponse.json({ message: "Verification email sent" }, { status: 200 });
}
