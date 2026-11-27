import { defineConfig } from 'drizzle-kit'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env' })

// The schema is applied with `npm run db:init` (db/init.sql); this config is for drizzle-kit studio/introspection.
export default defineConfig({
    dialect: 'postgresql',
    schema: './src/lib/db/schema.ts',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
})
