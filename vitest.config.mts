import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src"),
            // Next.js provides this guard; in tests it is a no-op
            "server-only": path.resolve(__dirname, "tests/support/empty.ts"),
        },
    },
    test: {
        environment: "node",
        // integration and e2e tests share one database, so run files one at a time
        fileParallelism: false,
        testTimeout: 30_000,
    },
});
