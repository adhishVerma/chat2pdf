// Prints OpenAI token usage per user: `npm run usage` (last 30 days) or
// `npm run usage -- 7` for the last 7 days. Plain JS so it runs in the Docker image too:
// docker compose exec app node scripts/usage-report.mjs
import pg from "pg";

const days = Math.max(1, parseInt(process.argv[2] || "30", 10));
const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
});
await client.connect();
const { rows } = await client.query(
    `SELECT u.email,
            SUM(o.prompt_tokens + o.completion_tokens) FILTER (WHERE o.kind = 'answer')    AS answer,
            SUM(o.prompt_tokens + o.completion_tokens) FILTER (WHERE o.kind = 'rewrite')   AS rewrite,
            SUM(o.prompt_tokens) FILTER (WHERE o.kind = 'embedding')                       AS embedding,
            SUM(o.prompt_tokens + o.completion_tokens)                                     AS total
       FROM openai_usage o JOIN users u ON u.id = o.user_id
      WHERE o.created_at >= now() - make_interval(days => $1)
      GROUP BY u.email
      ORDER BY total DESC`,
    [days],
);
console.log(`OpenAI tokens per user, last ${days} days`);
console.table(rows.map((r) => ({
    email: r.email,
    answer: Number(r.answer ?? 0),
    rewrite: Number(r.rewrite ?? 0),
    embedding: Number(r.embedding ?? 0),
    total: Number(r.total ?? 0),
})));
await client.end();
