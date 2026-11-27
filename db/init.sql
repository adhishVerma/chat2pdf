-- Idempotent schema for chat2pdf. Run with `npm run db:init`.
-- Works on Amazon RDS for PostgreSQL 15+ (pgvector is a supported extension) or any Postgres with pgvector.

CREATE EXTENSION IF NOT EXISTS vector;

DO $$ BEGIN
    CREATE TYPE "userEnum" AS ENUM ('assistant', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE chat_status AS ENUM ('pending', 'processing', 'ready', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS users (
    id            varchar(64) PRIMARY KEY,
    email         varchar(320) NOT NULL UNIQUE,
    password_hash text NOT NULL,
    created_at    timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chats (
    id         serial PRIMARY KEY,
    pdf_name   text NOT NULL,
    pdf_url    text NOT NULL,
    created_at timestamp NOT NULL DEFAULT now(),
    "userId"   varchar(256) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_key   text NOT NULL
);
CREATE INDEX IF NOT EXISTS chats_user_id_idx ON chats ("userId");

-- PDF processing queue state (added after the first schema; safe to re-run)
ALTER TABLE chats ADD COLUMN IF NOT EXISTS status chat_status NOT NULL DEFAULT 'pending';
ALTER TABLE chats ADD COLUMN IF NOT EXISTS error text;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS locked_at timestamp;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS next_attempt_at timestamp NOT NULL DEFAULT now();
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chats' AND column_name = 'processed') THEN
        UPDATE chats SET status = 'ready' WHERE processed;
        ALTER TABLE chats DROP COLUMN processed;
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS chats_queue_idx ON chats (status, next_attempt_at);

CREATE TABLE IF NOT EXISTS messages (
    id         serial PRIMARY KEY,
    chat_id    integer NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    content    text NOT NULL,
    created_at timestamp NOT NULL DEFAULT now(),
    role       "userEnum" NOT NULL
);
CREATE INDEX IF NOT EXISTS messages_chat_id_idx ON messages (chat_id);

CREATE TABLE IF NOT EXISTS document_chunks (
    id        serial PRIMARY KEY,
    chat_id   integer NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    content   text NOT NULL,
    metadata  jsonb NOT NULL DEFAULT '{}',
    embedding vector(1536) NOT NULL
);
CREATE INDEX IF NOT EXISTS document_chunks_chat_id_idx ON document_chunks (chat_id);

-- Fixed-window rate limit counters (shared by all app instances)
CREATE TABLE IF NOT EXISTS rate_limits (
    key          text PRIMARY KEY,
    window_start timestamptz NOT NULL DEFAULT now(),
    count        integer NOT NULL DEFAULT 0
);

-- Email verification and password reset
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at timestamp;
-- bumped on password reset; sessions carrying an older version are rejected
ALTER TABLE users ADD COLUMN IF NOT EXISTS session_version integer NOT NULL DEFAULT 0;

DO $$ BEGIN
    CREATE TYPE auth_token_type AS ENUM ('verify_email', 'reset_password');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS auth_tokens (
    id         serial PRIMARY KEY,
    user_id    varchar(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       auth_token_type NOT NULL,
    token_hash text NOT NULL UNIQUE,
    expires_at timestamp NOT NULL,
    used_at    timestamp,
    created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS auth_tokens_user_idx ON auth_tokens (user_id, type);
