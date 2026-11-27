import "server-only";
import { createHash, randomBytes } from "crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "../db";
import { authTokens } from "../db/schema";

type TokenType = "verify_email" | "reset_password";

const TTL_MINUTES: Record<TokenType, number> = {
    verify_email: 24 * 60,
    reset_password: 60,
};

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

// Creates a one-time token and returns the raw value (only its hash is stored).
// Any earlier unused token of the same type for this user stops working.
export async function issueToken(userId: string, type: TokenType) {
    const token = randomBytes(32).toString("base64url");
    await db.update(authTokens).set({ usedAt: new Date() })
        .where(and(eq(authTokens.userId, userId), eq(authTokens.type, type), isNull(authTokens.usedAt)));
    await db.insert(authTokens).values({
        userId,
        type,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + TTL_MINUTES[type] * 60 * 1000),
    });
    return token;
}

// Marks a valid token as used and returns its user id, or null if it is
// unknown, expired or already used.
export async function consumeToken(token: string, type: TokenType): Promise<string | null> {
    if (!token || token.length > 100) return null;
    const [row] = await db.update(authTokens).set({ usedAt: new Date() })
        .where(and(
            eq(authTokens.tokenHash, hashToken(token)),
            eq(authTokens.type, type),
            isNull(authTokens.usedAt),
            gt(authTokens.expiresAt, new Date()),
        ))
        .returning({ userId: authTokens.userId });
    return row?.userId ?? null;
}
