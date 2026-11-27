import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken, type Session } from "./session";

// Returns the signed-in user for the current request, or null.
export async function getSession(): Promise<Session | null> {
    return verifySessionToken(cookies().get(SESSION_COOKIE)?.value);
}
