// Fixed-window rate limiting stored in Postgres, so limits hold across app instances.
import "server-only";
import { getPool } from "./db";

export type Limit = { limit: number; windowSeconds: number };

// Tune limits here.
export const LIMITS = {
    signInPerIp: { limit: 30, windowSeconds: 15 * 60 },
    signInPerEmail: { limit: 10, windowSeconds: 15 * 60 },
    signUpPerIp: { limit: 5, windowSeconds: 60 * 60 },
    uploadsPerUserHour: { limit: 20, windowSeconds: 60 * 60 },
    uploadsPerUserDay: { limit: 50, windowSeconds: 24 * 60 * 60 },
    chatPerUserMinute: { limit: 20, windowSeconds: 60 },
    chatPerUserDay: { limit: 300, windowSeconds: 24 * 60 * 60 },
    emailPerUser: { limit: 3, windowSeconds: 60 * 60 },
    emailPerIp: { limit: 10, windowSeconds: 60 * 60 },
    chatsCreatedPerUserHour: { limit: 20, windowSeconds: 60 * 60 },
    retriesPerUserHour: { limit: 10, windowSeconds: 60 * 60 }, // each retry re-embeds the whole PDF
    passwordChecksPerUser: { limit: 10, windowSeconds: 15 * 60 }, // change password, delete account
} satisfies Record<string, Limit>;

export type RateLimitResult = { ok: boolean; remaining: number; retryAfterSeconds: number };

// Counts one hit against `key` and reports whether it is within the limit.
export async function hit(key: string, { limit, windowSeconds }: Limit): Promise<RateLimitResult> {
    if (process.env.DISABLE_RATE_LIMITS === "true") {
        return { ok: true, remaining: limit, retryAfterSeconds: 0 };
    }
    const { rows } = await getPool().query<{ count: number; reset_in: number }>(
        `INSERT INTO rate_limits (key, window_start, count) VALUES ($1, now(), 1)
         ON CONFLICT (key) DO UPDATE SET
             count        = CASE WHEN rate_limits.window_start <= now() - make_interval(secs => $2) THEN 1 ELSE rate_limits.count + 1 END,
             window_start = CASE WHEN rate_limits.window_start <= now() - make_interval(secs => $2) THEN now() ELSE rate_limits.window_start END
         RETURNING count, CEIL(EXTRACT(EPOCH FROM (window_start + make_interval(secs => $2) - now())))::int AS reset_in`,
        [key, windowSeconds],
    );
    // expired counters are removed by the hourly cleanup job (src/lib/jobs/cleanup.ts)
    const { count, reset_in } = rows[0];
    return { ok: count <= limit, remaining: Math.max(0, limit - count), retryAfterSeconds: Math.max(1, reset_in) };
}

// Checks several limits; returns the first one that is exceeded, if any.
export async function checkLimits(checks: [string, Limit][]): Promise<RateLimitResult | null> {
    for (const [key, limit] of checks) {
        const result = await hit(key, limit);
        if (!result.ok) return result;
    }
    return null;
}

export function tooManyRequests(result: RateLimitResult, message = "Too many requests. Please try again later.") {
    return Response.json({ message }, {
        status: 429,
        headers: { "Retry-After": String(result.retryAfterSeconds) },
    });
}

// Client IP from the reverse proxy (ALB/Nginx set X-Forwarded-For). Only trust this
// header when the app is reachable solely through your proxy.
// The client's IP for rate limiting. Proxies append to X-Forwarded-For, so the
// leftmost entries are whatever the client sent and can't be trusted. Count
// TRUSTED_PROXY_COUNT entries from the right instead: with one proxy in front
// (Caddy in deploy/, or an ALB) the last entry is the address that proxy saw.
export function clientIp(req: Request, env: Record<string, string | undefined> = process.env) {
    const hops = Math.max(1, parseInt(env.TRUSTED_PROXY_COUNT || "1", 10) || 1);
    const forwarded = (req.headers.get("x-forwarded-for") ?? "")
        .split(",").map((s) => s.trim()).filter(Boolean);
    if (forwarded.length) return forwarded[Math.max(0, forwarded.length - hops)];
    return req.headers.get("x-real-ip")?.trim() || "unknown";
}

// Who a per-user limit counts against. Everyone shares the demo account, so
// demo visitors are counted by IP address instead; otherwise one visitor
// could use up the limits for all of them.
export function limitSubject(session: { userId: string; isDemo?: boolean }, req: Request) {
    return session.isDemo ? `demo:${clientIp(req)}` : session.userId;
}
