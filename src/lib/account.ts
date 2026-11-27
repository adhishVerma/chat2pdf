// Account changes the signed-in user makes for themselves.
import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "./db";
import { chats, users } from "./db/schema";
import { hashPassword, verifyPassword } from "./auth/password";
import { deleteFromS3 } from "./s3";

export async function checkPassword(userId: string, password: string) {
    const [user] = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, userId));
    return !!user && (await verifyPassword(password, user.passwordHash));
}

// Sets a new password and bumps the session version, which signs out every
// other session. Returns the new version so the caller can re-issue its cookie.
export async function changePassword(userId: string, newPassword: string) {
    const [user] = await db.update(users).set({
        passwordHash: await hashPassword(newPassword),
        sessionVersion: sql`${users.sessionVersion} + 1`,
    }).where(eq(users.id, userId)).returning({ id: users.id, email: users.email, sessionVersion: users.sessionVersion });
    return user;
}

// Deletes the user's PDFs from S3, then the user. Chats, messages, chunks and
// tokens go with it through ON DELETE CASCADE. Any S3 object that fails to
// delete is picked up later by the hourly cleanup job, since it no longer has a chat.
export async function deleteAccount(userId: string) {
    const files = await db.select({ key: chats.file_key }).from(chats).where(eq(chats.userId, userId));
    await Promise.all(files.map((f) => deleteFromS3(f.key)));
    await db.delete(users).where(eq(users.id, userId));
    return { deletedPdfs: files.length };
}
