import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";

neonConfig.fetchConnectionCache = true;

let instance: NeonHttpDatabase | null = null;

function getDb(): NeonHttpDatabase {
  if (!instance) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL is not set");
    }
    instance = drizzle(neon(url));
  }
  return instance;
}

// Connects on first query instead of at import time, so builds don't need the DB URL.
export const db = new Proxy({} as NeonHttpDatabase, {
  get: (_target, key) => {
    const real = getDb();
    const value = Reflect.get(real, key, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
