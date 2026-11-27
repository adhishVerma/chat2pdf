# chat2pdf

Upload a PDF and chat with it. The app keeps everything in its own backend: users, chats, messages and the PDF's embeddings live in one Postgres database (with pgvector), PDFs live in S3, and OpenAI generates the answers.

## Stack

- Next.js 15 (App Router) + React 19 for the UI and the API, Tailwind, shadcn/ui
- Built-in email/password auth: scrypt password hashes, signed JWT session in an httpOnly cookie
- Postgres + pgvector (Amazon RDS, EC2, or Docker) via Drizzle ORM and `pg`
- S3 (or any S3-compatible store such as MinIO) for PDFs, bucket kept private
- OpenAI through the official SDK: `gpt-4o-mini` for answers, `text-embedding-3-small` for embeddings (override with `OPENAI_CHAT_MODEL` / `OPENAI_EMBEDDING_MODEL`)

No Clerk, Neon, Pinecone or Lambda.

## How it works

1. **Upload:** the browser asks `POST /api/upload-url` for a pre-signed S3 URL (signed-in users only, PDF only, max 10 MB) and uploads the file straight to S3. AWS keys never leave the server.
2. **Process:** `POST /api/create-chat` saves the chat and, in the background on the server, downloads the PDF, splits it into chunks, embeds them and stores them in `document_chunks`. The chat is marked `processed` when done.
3. **Chat:** `POST /api/chat` checks the chat belongs to you, rewrites follow-up questions into standalone ones, finds the closest chunks with pgvector and streams an answer that cites page numbers. The response body is one JSON line with the sources, then the answer text. Both sides of the conversation are saved on the server.
4. **View:** `GET /api/chat/:id/pdf` checks ownership and redirects to a 15-minute signed S3 link.

## Run locally

```bash
npm install
cp .env.example .env          # fill in AUTH_SECRET, S3 and OpenAI values
docker compose up -d db       # Postgres 16 + pgvector, schema applied on first start
npm run db:init               # (optional) re-apply db/init.sql, safe to run any time
npm run dev
```

Open http://localhost:3000 and create an account.

## Deploy on AWS

**Option A, single EC2 instance:** install Docker, copy the repo and `.env`, then run `docker compose --profile app up -d --build`. This runs Postgres and the app on the same machine. Put Nginx or an ALB in front for HTTPS.

**Option B, EC2/ECS + RDS:**

1. Create an RDS PostgreSQL 15+ instance. pgvector is supported on RDS, and `db/init.sql` enables it.
2. Set `DATABASE_URL` to the RDS endpoint (leave `DATABASE_SSL` unset so TLS is used) and run `npm run db:init` once.
3. Build the image (`docker build -t chat2pdf .`) and run it on EC2 or ECS with the env vars from `.env.example`.

Processing runs inside the app server, so host it on a long-running server (EC2/ECS), not a serverless platform with short timeouts.

### S3 bucket

Keep the bucket private. Give the app an IAM user or role with only `s3:PutObject`, `s3:GetObject` and `s3:DeleteObject` on the bucket. Because the browser uploads directly, add a CORS rule:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://your-domain.com"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }
]
```

## Environment variables

See [`.env.example`](./.env.example). None of them are sent to the browser.

## Scripts

- `npm run dev` – dev server
- `npm run build` / `npm start` – production build and server (the build needs no env vars)
- `npm run db:init` – create or update the database schema from `db/init.sql`
- `npm run lint` – lint
