import "server-only";
import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

type DB = NodePgDatabase<typeof schema>;

let pool: Pool | null = null;
let instance: DB | null = null;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }
    pool = new Pool({
      connectionString,
      max: 10,
      // RDS requires TLS; set DATABASE_SSL=false for a local Postgres
      ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
    });
  }
  return pool;
}

function getDb(): DB {
  if (!instance) {
    instance = drizzle(getPool(), { schema });
  }
  return instance;
}

// Connects on first query instead of at import time, so builds don't need the DB URL.
export const db = new Proxy({} as DB, {
  get: (_target, key) => {
    const real = getDb();
    const value = Reflect.get(real, key, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
