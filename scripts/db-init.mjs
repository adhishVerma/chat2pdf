// Applies db/init.sql to DATABASE_URL. Plain JS so it also runs inside the
// production Docker image: `node scripts/db-init.mjs`.
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
}

const client = new pg.Client({
    connectionString,
    ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
});

// the database may still be starting (docker compose), so retry for a bit
for (let attempt = 1; ; attempt++) {
    try {
        await client.connect();
        break;
    } catch (err) {
        if (attempt >= 15) throw err;
        console.log(`waiting for database (${err.code ?? err.message})…`);
        await new Promise((r) => setTimeout(r, 2000));
    }
}
await client.query(readFileSync(path.join(root, "db", "init.sql"), "utf8"));
await client.end();
console.log("Database schema is up to date");
