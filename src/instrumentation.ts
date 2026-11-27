// Runs once when the Next.js server starts.
export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs" && process.env.DISABLE_WORKER !== "true") {
        const { startWorker } = await import("./lib/jobs/worker");
        startWorker();
    }
}
