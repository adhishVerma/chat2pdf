// Helpers for integration tests that need Postgres (DATABASE_URL, pgvector).
import { readFileSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { getPool } from "@/lib/db";

export const hasDatabase = !!process.env.DATABASE_URL;

export async function resetDatabase() {
    const pool = getPool();
    await pool.query("DROP TABLE IF EXISTS openai_usage, auth_tokens, rate_limits, document_chunks, messages, chats, users CASCADE");
    await pool.query(readFileSync(path.join(__dirname, "../../db/init.sql"), "utf8"));
}

export async function createUser(email = `${randomUUID()}@example.com`) {
    const id = randomUUID();
    await getPool().query("INSERT INTO users (id, email, password_hash) VALUES ($1, $2, 'x')", [id, email]);
    return { id, email };
}

export async function createChat(userId: string, fileKey = "uploads/test.pdf") {
    const { rows } = await getPool().query<{ id: number }>(
        `INSERT INTO chats (pdf_name, pdf_url, "userId", file_key) VALUES ('test.pdf', 's3://b/k', $1, $2) RETURNING id`,
        [userId, fileKey],
    );
    return rows[0].id;
}
