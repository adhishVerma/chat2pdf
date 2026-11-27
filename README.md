# chat2pdf

Upload a PDF and chat with it. The app stores the PDF in S3, an AWS Lambda splits it into chunks and embeds them into Pinecone, and answers are generated with OpenAI over the retrieved chunks (LangChain + Vercel AI SDK). Chats and messages are stored in Neon Postgres via Drizzle, and users sign in with Clerk.

## Stack

- Next.js 14 (App Router), Tailwind, shadcn/ui
- Clerk for auth
- Neon Postgres + Drizzle ORM
- AWS S3 for PDF storage, AWS Lambda for PDF processing (`LAMBDA_URL`)
- Pinecone vector store, OpenAI (`gpt-3.5-turbo`, embeddings)

## How uploads work

1. The browser asks `POST /api/upload-url` for a pre-signed S3 URL (signed-in users only, PDF only, max 10 MB).
2. The browser `PUT`s the file straight to S3 with that URL. AWS credentials never leave the server.
3. The browser calls `POST /api/create-chat`, which saves the chat and triggers the Lambda to embed the PDF.

## Setup

```bash
npm install
cp .env.example .env   # then fill in the values
npx drizzle-kit push:pg  # create the tables in your database
npm run dev
```

Open http://localhost:3000.

### Environment variables

See [`.env.example`](./.env.example) for the full list. Anything prefixed `NEXT_PUBLIC_` is bundled into the browser, so secrets (AWS keys, database URL, API keys) must never use that prefix.

### S3 bucket CORS

Because the browser uploads directly to S3, the bucket needs a CORS rule that allows `PUT` from your app's origin, for example:

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

The PDF viewer loads `https://<bucket>.s3.ap-south-1.amazonaws.com/<file_key>`, so uploaded objects must be readable by the browser.

## Scripts

- `npm run dev` – start the dev server
- `npm run build` – production build (works without env vars set; they are checked at runtime)
- `npm run lint` – lint
