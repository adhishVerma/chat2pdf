// Polls the PDF queue and processes jobs. Started once per server process from
// src/instrumentation.ts, or on its own with `npm run worker`.
import "server-only";
import { claimJob, runJob } from "./pdf-queue";

const POLL_MS = 2000;

declare global {
    // eslint-disable-next-line no-var
    var __pdfWorker: { wake: () => void } | undefined;
}

export function startWorker() {
    if (globalThis.__pdfWorker) return globalThis.__pdfWorker;
    const concurrency = Math.max(1, parseInt(process.env.WORKER_CONCURRENCY || "2"));
    let running = 0;
    let timer: NodeJS.Timeout | null = null;

    const tick = async () => {
        timer = null;
        try {
            while (running < concurrency) {
                const job = await claimJob();
                if (!job) break;
                running++;
                runJob(job).finally(() => {
                    running--;
                    schedule(0);
                });
            }
        } catch (err) {
            console.error("[pdf-queue] poll failed", err);
        }
        schedule(POLL_MS);
    };

    const schedule = (ms: number) => {
        if (timer) {
            if (ms > 0) return;
            clearTimeout(timer);
        }
        timer = setTimeout(tick, ms);
    };

    globalThis.__pdfWorker = { wake: () => schedule(0) };
    schedule(0);
    console.log(`[pdf-queue] worker started (concurrency ${concurrency})`);
    return globalThis.__pdfWorker;
}

// Ask the in-process worker to look for work now instead of at the next poll.
export function wakeWorker() {
    globalThis.__pdfWorker?.wake();
}
