# AWS OpenSearch + Next.js on Vercel

Next.js 16 application with App Router that integrates with AWS OpenSearch Serverless, deployed on Vercel.

## Stack

- Next.js 16 (App Router, Turbopack)
- TypeScript
- Tailwind CSS
- `@opensearch-project/opensearch` — OpenSearch client
- `@vercel/aws` — OIDC-based AWS credential exchange

## Getting Started

### Prerequisites

- Node.js 20+
- Vercel CLI (`npm i -g vercel`)
- A Vercel project linked to an OpenSearch Serverless collection (via Vercel Marketplace)

### Setup

```bash
# Install dependencies
npm install

# Pull environment variables from Vercel
vercel env pull .env.local

# Start development server
vercel dev
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `VERCEL_OIDC_TOKEN` | Auto-injected by Vercel in production; pulled via `vercel env pull` for local dev |
| `OPEN_SEARCH_AWS_ROLE_ARN` | IAM role ARN for STS AssumeRoleWithWebIdentity |
| `OPEN_SEARCH_AWS_REGION` | AWS region of the OpenSearch collection |
| `OPEN_SEARCH_OPENSEARCH_ENDPOINT` | HTTPS endpoint of the AOSS collection |

See `.env.local.example` for a template.

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Check OpenSearch connectivity |
| GET | `/api/search?q=term&index=name` | Search documents |
| POST | `/api/index` | Index a document |

### Index a document

```bash
curl -X POST http://localhost:3000/api/index \
  -H 'Content-Type: application/json' \
  -d '{"index": "products", "document": {"title": "Widget", "price": 9.99}}'
```

### Search

```bash
curl 'http://localhost:3000/api/search?q=widget&index=products'
```

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── health/route.ts    — Connectivity check
│   │   ├── index/route.ts     — Document indexing
│   │   └── search/route.ts    — Search queries
│   ├── components/
│   │   ├── ConnectionStatus.tsx
│   │   └── SearchInterface.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   └── opensearch.ts          — OpenSearch client singleton
├── types/
│   └── index.ts               — Shared TypeScript interfaces
├── next.config.ts
├── tailwind.config.ts
└── vercel.json
```

## Authentication Flow

```
Vercel Function
  → @vercel/aws createOpenSearch()
    → Reads VERCEL_OIDC_TOKEN
    → STS AssumeRoleWithWebIdentity
    → Temporary AWS credentials
    → AwsSigv4Signer signs requests to AOSS
```

## Deploy

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

## Notes

- OpenSearch Serverless (AOSS) is IAM-only — no basic auth fallback
- The OIDC token expires after ~12h locally; re-run `vercel env pull` to refresh
- `vercel.json` enables `oidcTokenConfig` so the token is injected in production
- All API routes use Node.js runtime (required for `aws4` SigV4 signing)
