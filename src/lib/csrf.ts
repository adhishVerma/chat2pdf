// Cross-site request check for API writes (defense in depth on top of the
// SameSite=Lax session cookie). Edge-safe: used by src/middleware.ts.
//
// Browsers send Origin (and Sec-Fetch-Site) on every POST/PUT/PATCH/DELETE,
// so a write from another site is refused even if a cookie rides along.
// Requests with neither header come from non-browser clients (curl, server
// code), which can't carry a victim's cookie, so they are let through.

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

type Env = Record<string, string | undefined>;

export function isCrossSiteWrite(req: Request, env: Env = process.env): boolean {
    if (SAFE_METHODS.has(req.method.toUpperCase())) return false;

    const fetchSite = req.headers.get("sec-fetch-site");
    if (fetchSite === "cross-site" || fetchSite === "same-site") return true;

    const origin = req.headers.get("origin");
    if (!origin) return false;
    if (origin === "null") return true; // sandboxed iframes, file:// pages

    let originHost: string;
    try {
        originHost = new URL(origin).host;
    } catch {
        return true;
    }
    const allowed = new Set<string>();
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    if (host) allowed.add(host.split(",")[0].trim());
    try {
        allowed.add(new URL(req.url).host);
    } catch { /* ignore */ }
    if (env.APP_URL) {
        try {
            allowed.add(new URL(env.APP_URL).host);
        } catch { /* ignore */ }
    }
    return !allowed.has(originHost);
}
