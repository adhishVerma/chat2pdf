import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import { SESSION_COOKIE, verifySessionToken, type Session } from "./session";
import { isDemoEmail } from "../demo-config";

export type SessionUser = Session & { emailVerified: boolean; isDemo: boolean };

// Returns the signed-in user for the current request, or null. Checks the
// database so sessions end when the user is deleted or resets their password.
// Cached per server render, so the header, sidebar and page share one lookup.
export const getSession = cache(async (): Promise<SessionUser | null> => {
    const session = await verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
    if (!session) return null;
    const [user] = await db.select({
        email: users.email,
        sessionVersion: users.sessionVersion,
        emailVerifiedAt: users.emailVerifiedAt,
    }).from(users).where(eq(users.id, session.userId));
    if (!user || user.sessionVersion !== session.version) return null;
    return { ...session, email: user.email, emailVerified: !!user.emailVerifiedAt, isDemo: isDemoEmail(user.email) };
});

export function emailVerificationRequired() {
    return process.env.REQUIRE_EMAIL_VERIFICATION !== "false";
}
