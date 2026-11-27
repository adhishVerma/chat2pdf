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
    // occasionally clear out expired counters
    if (Math.random() < 0.01) {
        getPool().query(`DELETE FROM rate_limits WHERE window_start < now() - interval '2 days'`).catch(() => undefined);
    }
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
export function clientIp(req: Request) {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    return req.headers.get("x-real-ip") ?? "unknown";
}
