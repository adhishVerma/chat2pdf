// Health check for Docker, load balancers and uptime monitors.
// 200 when the app can reach Postgres, 503 when it can't. Public, and says
// nothing beyond up/down.
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

const DB_TIMEOUT_MS = 2000;

export async function GET() {
    let db: "ok" | "down" = "ok";
    try {
        await Promise.race([
            getPool().query("SELECT 1"),
            new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), DB_TIMEOUT_MS)),
        ]);
    } catch (err) {
        console.error("[health] database check failed", err);
        db = "down";
    }
    const worker = process.env.DISABLE_WORKER === "true" ? "disabled" : globalThis.__pdfWorker ? "running" : "stopped";
    return Response.json(
        { status: db === "ok" ? "ok" : "error", db, worker },
        { status: db === "ok" ? 200 : 503, headers: { "Cache-Control": "no-store" } },
    );
}
