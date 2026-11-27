import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

// Pages and API routes reachable while signed out
const PUBLIC_PATHS = ["/", "/sign-in", "/sign-up", "/verify-email", "/forgot-password", "/reset-password"];
const PUBLIC_PREFIXES = ["/api/auth/"];

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    if (PUBLIC_PATHS.includes(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
        return NextResponse.next();
    }

    const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
    if (session) {
        return NextResponse.next();
    }

    if (pathname.startsWith("/api/")) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const signIn = new URL("/sign-in", req.url);
    signIn.searchParams.set("next", pathname);
    return NextResponse.redirect(signIn);
}

export const config = {
    // everything except static files and Next internals
    matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api)(.*)"],
};
