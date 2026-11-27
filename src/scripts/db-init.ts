// Applies db/init.sql to DATABASE_URL. Usage: npm run db:init
import { readFileSync } from "fs";
import path from "path";
import { Client } from "pg";

async function main() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is not set");
    const client = new Client({
        connectionString,
        ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
    });
    await client.connect();
    const sql = readFileSync(path.join(process.cwd(), "db", "init.sql"), "utf8");
    await client.query(sql);
    await client.end();
    console.log("Database schema is up to date");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
