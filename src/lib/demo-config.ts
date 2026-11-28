// The shared demo account. Its credentials are shown on the landing and
// sign-in pages, so treat everything in it as public: anyone using the demo
// can see what others upload. PDFs and chats are deleted DEMO_TTL_MINUTES after
// they're created, and demo sign-ins last the same length of time.
type Env = Record<string, string | undefined>;

export const DEMO_TTL_MINUTES = 15;

export function demoConfig(env: Env = process.env) {
    return {
        enabled: env.DEMO_ACCOUNT !== "false",
        email: (env.DEMO_EMAIL || "demo@chatpdf.app").trim().toLowerCase(),
        password: env.DEMO_PASSWORD || "try-chatpdf-demo",
    };
}

export function isDemoEmail(email: string | null | undefined, env: Env = process.env) {
    const cfg = demoConfig(env);
    return cfg.enabled && !!email && email.trim().toLowerCase() === cfg.email;
}
