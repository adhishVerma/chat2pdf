import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import z from "zod";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { issueToken } from "@/lib/auth/tokens";
import { isDemoEmail } from "@/lib/demo-config";
import { sendPasswordResetEmail } from "@/lib/email";
import { LIMITS, checkLimits, clientIp, tooManyRequests } from "@/lib/rate-limit";

const bodySchema = z.object({ email: z.string().trim().toLowerCase().email().max(320) });

// Always answers the same way, so it can't be used to find out which emails have accounts.
export async function POST(req: Request) {
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
        return NextResponse.json({ message: "Enter a valid email address" }, { status: 400 });
    }
    const { email } = parsed.data;
    const limited = await checkLimits([
        [`email:reset:ip:${clientIp(req)}`, LIMITS.emailPerIp],
        [`email:reset:${email}`, LIMITS.emailPerUser],
    ]);
    if (limited) {
        return tooManyRequests(limited, "Too many reset requests. Please try again later.");
    }

    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
    // the demo's password is public and fixed; never send it a reset link
    if (user && !isDemoEmail(email)) {
        try {
            await sendPasswordResetEmail(email, await issueToken(user.id, "reset_password"));
        } catch (err) {
            console.error("Failed to send password reset email", err);
        }
    }
    return NextResponse.json({ message: "If an account exists for that email, we've sent a reset link." }, { status: 200 });
}
