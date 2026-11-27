-- Idempotent schema for chat2pdf. Run with `npm run db:init`.
-- Works on Amazon RDS for PostgreSQL 15+ (pgvector is a supported extension) or any Postgres with pgvector.

CREATE EXTENSION IF NOT EXISTS vector;

DO $$ BEGIN
    CREATE TYPE "userEnum" AS ENUM ('assistant', 'user');
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
    file_key   text NOT NULL,
    processed  boolean NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS chats_user_id_idx ON chats ("userId");

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
