# chat2pdf

Upload a PDF and chat with it. The app keeps everything in its own backend: users, chats, messages and the PDF's embeddings live in one Postgres database (with pgvector), PDFs live in S3, and OpenAI generates the answers.

## Stack

- Next.js 15 (App Router) + React 19 for the UI and the API, Tailwind, shadcn/ui
- Built-in email/password auth: scrypt password hashes, signed JWT session in an httpOnly cookie, email verification and password reset via Amazon SES
- Postgres + pgvector (Amazon RDS, EC2, or Docker) via Drizzle ORM and `pg`
- S3 (or any S3-compatible store such as MinIO) for PDFs, bucket kept private
- OpenAI through the official SDK: `gpt-4o-mini` for answers, `text-embedding-3-small` for embeddings (override with `OPENAI_CHAT_MODEL` / `OPENAI_EMBEDDING_MODEL`)

No Clerk, Neon, Pinecone or Lambda.

## How it works

1. **Upload:** the browser asks `POST /api/upload-url` for a pre-signed S3 URL (signed-in users only, PDF only, max 10 MB) and uploads the file straight to S3. AWS keys never leave the server.
2. **Process:** `POST /api/create-chat` saves the chat as `pending`. A worker in the app server picks it up from a Postgres-backed queue, downloads the PDF, splits it into chunks per page, embeds them and stores them in `document_chunks`, then marks the chat `ready`. Failures retry up to 3 times with backoff (30s, 2m) and then show as `failed` with a Retry button. The chat window shows progress while this happens.
3. **Chat:** `POST /api/chat` checks the chat belongs to you, rewrites follow-up questions into standalone ones, finds the closest chunks with pgvector and streams an answer that cites page numbers. The response body is one JSON line with the sources, then the answer text. Both sides of the conversation are saved on the server.
4. **View:** `GET /api/chat/:id/pdf` checks ownership and redirects to a 15-minute signed S3 link.

## Run locally

Requires Node.js 22+ (the OpenAI SDK needs it) and Docker for the local database.

```bash
npm install
cp .env.example .env          # fill in AUTH_SECRET, S3 and OpenAI values
docker compose up -d db       # Postgres 16 + pgvector, schema applied on first start
npm run db:init               # (optional) re-apply db/init.sql, safe to run any time
npm run dev
```

Open http://localhost:3000 and create an account.

## Deploy on AWS (EC2)

`.github/workflows/deploy.yml` runs on every push to `main` (or manually from the Actions tab). It builds the Docker image, pushes it to GitHub Container Registry (`ghcr.io/<owner>/chat2pdf`), then SSHes into the server and runs `deploy/docker-compose.prod.yml`: Caddy (automatic HTTPS) → app (Next.js + PDF worker) → Postgres with pgvector. A one-off `migrate` container applies `db/init.sql` before the app starts.

### One-time server setup

1. Launch an EC2 instance (Ubuntu 24.04, t3.small or larger, 20 GB disk). Allow inbound 22 (your IP only), 80 and 443.
2. Point your domain's DNS A record at the instance's Elastic IP.
3. Install Docker: `curl -fsSL https://get.docker.com | sh && sudo usermod -aG docker ubuntu` (then log out and back in).
4. Create the app folder and env file:
   ```bash
   sudo mkdir -p /opt/chat2pdf && sudo chown ubuntu /opt/chat2pdf
   nano /opt/chat2pdf/.env   # values from .env.example, plus the lines below
   ```
   ```bash
   DOMAIN=chat.your-domain.com
   APP_URL=https://chat.your-domain.com
   POSTGRES_PASSWORD=<long random string>
   ```
   Give the instance an IAM role with S3 (your bucket) and `ses:SendEmail`, or put the keys in `.env`.

### GitHub settings

- Repository secrets: `EC2_HOST` (IP or hostname), `EC2_SSH_KEY` (private key for the instance), optionally `EC2_USER` (default `ubuntu`).
- Optional repository variable `APP_URL` enables a smoke test after each deploy.
- Optional: add required reviewers to the `production` environment to approve each deploy.

Without `EC2_HOST`, the workflow still builds and pushes the image and skips the deploy step.

### Using RDS instead of the local database

Create an RDS PostgreSQL 15+ instance (pgvector is supported), set `DATABASE_URL` to its endpoint and `DATABASE_SSL=true` in `.env`, and delete the `db` service and its `depends_on` entries from `deploy/docker-compose.prod.yml`.

### Without CI

On any Docker host: `docker build -t chat2pdf .`, then run `docker compose -f deploy/docker-compose.prod.yml up -d` with `APP_IMAGE=chat2pdf` set. For local all-in-one testing, `docker compose --profile app up -d --build` uses the root `docker-compose.yml`.

Processing runs in a worker inside the app server, so host it on a long-running server (EC2/ECS), not a serverless platform. Jobs are claimed with `FOR UPDATE SKIP LOCKED`, so several app instances can share the queue, and a job stuck in `processing` for 10 minutes (for example after a crash) is picked up again. To process on separate machines, set `DISABLE_WORKER=true` on the web servers and run `npm run worker` elsewhere.

The worker also runs a cleanup job every hour (`src/lib/jobs/cleanup.ts`). It deletes uploads older than 24 hours that never became a chat, expired or used email tokens, and old rate limit counters. An advisory lock keeps it to one instance at a time.

### S3 bucket

Keep the bucket private. Give the app an IAM user or role with only `s3:PutObject`, `s3:GetObject` and `s3:DeleteObject` on the bucket's objects, plus `s3:ListBucket` on the bucket (the cleanup job lists `uploads/`). Because the browser uploads directly, add a CORS rule:

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

### Email (Amazon SES)

New accounts get a confirmation link and must confirm before uploading (`REQUIRE_EMAIL_VERIFICATION=false` turns this off). "Forgot password?" on the sign-in page emails a one-hour reset link, and resetting signs the user out of every other session.

1. In SES (same region as `SES_REGION`), verify your sending domain or address.
2. New SES accounts are in the sandbox and can only send to verified addresses. Request production access before launch.
3. Set `EMAIL_FROM` (for example `ChatPdf <no-reply@your-domain.com>`) and `APP_URL`. Give the app `ses:SendEmail`, through the instance role or `SES_ACCESS_KEY_ID`/`SES_SECRET_ACCESS_KEY`.

Without `EMAIL_FROM`, emails are printed to the server log, which is handy in development.

## Rate limits

Limits are stored in Postgres (`rate_limits`), so they hold across instances. Defaults live in `src/lib/rate-limit.ts`:

| Action | Limit |
| --- | --- |
| Sign-in | 10 per email and 30 per IP every 15 minutes |
| Sign-up | 5 per IP per hour |
| Uploads | 20 per user per hour, 50 per day |
| Chat messages | 20 per user per minute, 300 per day |

Clients get HTTP 429 with a `Retry-After` header. IPs come from `X-Forwarded-For`, so only expose the app through your load balancer or Nginx, or clients can spoof it.

## Environment variables

See [`.env.example`](./.env.example). None of them are sent to the browser.

## Scripts

- `npm run dev` – dev server
- `npm run build` / `npm start` – production build and server (the build needs no env vars)
- `npm run db:init` – create or update the database schema from `db/init.sql`
- `npm run worker` – run the PDF processing worker on its own
- `npm run lint` / `npm run typecheck` – lint and type check
- `npm test` – unit tests, plus integration tests when `DATABASE_URL` points at a Postgres with pgvector (they reset that database, so use a throwaway one)
- `npm run test:e2e` – end-to-end tests against a running app (`E2E_BASE_URL`); see `.github/workflows/ci.yml` for the setup with moto (S3) and `tests/e2e/fake-openai.mjs`
