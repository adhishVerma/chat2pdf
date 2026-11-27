// Session tokens: a signed JWT (HS256) in an httpOnly cookie.
// Edge-safe (uses only `jose`), so middleware can verify it too.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "chat2pdf_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type Session = { userId: string; email: string; version: number };

function getSecret() {
    const secret = process.env.AUTH_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error("AUTH_SECRET must be set to at least 32 characters");
    }
    return new TextEncoder().encode(secret);
}

export async function createSessionToken(session: Session) {
    return new SignJWT({ email: session.email, ver: session.version })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(session.userId)
        .setIssuedAt()
        .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
        .sign(getSecret());
}

export async function verifySessionToken(token: string | undefined): Promise<Session | null> {
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
        if (!payload.sub || typeof payload.email !== "string") return null;
        return { userId: payload.sub, email: payload.email, version: typeof payload.ver === "number" ? payload.ver : 0 };
    } catch {
        return null;
    }
}

export function sessionCookieOptions() {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
        maxAge: SESSION_MAX_AGE_SECONDS,
    };
}
