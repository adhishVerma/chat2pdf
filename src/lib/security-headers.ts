// Security headers for every page and API response. The CSP is built at
// request time (in src/middleware.ts) because it needs the S3 origin, which
// comes from runtime environment variables, not from the build.

type Env = Record<string, string | undefined>;

// Origin the browser talks to for uploads (PUT) and for viewing PDFs (iframe).
export function s3Origin(env: Env = process.env): string | null {
    if (env.S3_ENDPOINT) {
        try {
            return new URL(env.S3_ENDPOINT).origin;
        } catch {
            return null;
        }
    }
    if (!env.S3_BUCKET_NAME) return null;
    const region = env.S3_REGION || "ap-south-1";
    return `https://${env.S3_BUCKET_NAME}.s3.${region}.amazonaws.com`;
}

export function buildCsp(env: Env = process.env): string {
    const dev = env.NODE_ENV === "development";
    const s3 = s3Origin(env);
    const directives: Record<string, string[]> = {
        "default-src": ["'self'"],
        // Next.js injects inline scripts for hydration; dev mode also needs eval
        "script-src": ["'self'", "'unsafe-inline'", ...(dev ? ["'unsafe-eval'"] : [])],
        "style-src": ["'self'", "'unsafe-inline'"],
        "img-src": ["'self'", "data:", "blob:"],
        "font-src": ["'self'", "data:"],
        "connect-src": ["'self'", ...(s3 ? [s3] : []), ...(dev ? ["ws:"] : [])],
        "frame-src": ["'self'", ...(s3 ? [s3] : [])],
        "object-src": ["'none'"],
        "base-uri": ["'self'"],
        "form-action": ["'self'"],
        "frame-ancestors": ["'none'"],
    };
    return Object.entries(directives).map(([k, v]) => `${k} ${v.join(" ")}`).join("; ");
}

// Headers that don't depend on the environment (also set in next.config.mjs
// for static files, which the middleware doesn't see).
export const STATIC_SECURITY_HEADERS: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "Cross-Origin-Opener-Policy": "same-origin",
};

export function applySecurityHeaders(headers: Headers, env: Env = process.env) {
    for (const [k, v] of Object.entries(STATIC_SECURITY_HEADERS)) headers.set(k, v);
    headers.set("Content-Security-Policy", buildCsp(env));
}
