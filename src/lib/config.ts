import z from "zod";

const envSchema = z.object({
    OPENAI_API_KEY: z.string().trim().min(1),
    PINECONE_API_KEY: z.string().trim().min(1),
    PINECONE_INDEX_NAME: z.string().trim().min(1),
    INDEX_INIT_TIMEOUT: z.coerce.number().min(1).default(60000),
})

type Env = z.infer<typeof envSchema>;

let parsed: Env | null = null;

// Validated lazily on first use, so `next build` (and pages that never touch
// Pinecone/OpenAI) don't crash when these variables aren't set.
export function getEnv(): Env {
    if (!parsed) {
        parsed = envSchema.parse(process.env);
    }
    return parsed;
}

export const env = new Proxy({} as Env, {
    get: (_target, key: string) => getEnv()[key as keyof Env],
});
