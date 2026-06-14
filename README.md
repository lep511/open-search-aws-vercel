# AWS OpenSearch + Next.js on Vercel

Next.js 16 application with App Router that integrates with AWS OpenSearch Serverless, deployed on Vercel.

## Stack

- Next.js 16 (App Router, Turbopack)
- TypeScript
- Tailwind CSS
- `@opensearch-project/opensearch` — OpenSearch client
- `@vercel/aws` — OIDC-based AWS credential exchange
- `ai` + `voyage-ai-provider` — Vercel AI SDK for semantic embeddings (Voyage AI voyage-4)

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
| `VOYAGE_API_KEY` | API key for Voyage AI embedding generation (semantic/hybrid search) |

See `.env.local.example` for a template.

## API Reference

All endpoints are accessible at your deployment URL (e.g. `https://aws-open-search-vercel.vercel.app`).

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Check OpenSearch connectivity |
| GET | `/api/search` | Search documents (keyword, semantic, or hybrid) |
| POST | `/api/index` | Index a new document |
| GET | `/api/tags` | List all available tags with counts |
| GET | `/api/mapping` | Get the index mapping |
| POST | `/api/create-index` | Create the OpenSearch index |
| POST | `/api/semantic-setup` | Configure semantic search capabilities |

### Search documents

```bash
GET /api/search?q=<query>&mode=<mode>&tag=<tags>
```

**Parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `q` | Yes (or `tag`) | Search query text |
| `mode` | No | `keyword`, `semantic`, or `hybrid` (default: `hybrid`) |
| `tag` | No | Filter by tags (comma-separated) |

**Example:**

```bash
curl 'https://aws-open-search-vercel.vercel.app/api/search?q=serverless&mode=hybrid'
```

**Response:**

```json
{
  "total": 3,
  "mode": "hybrid",
  "hits": [
    {
      "id": "abc123",
      "score": 0.92,
      "source": {
        "title": "Document title",
        "content": "Document content...",
        "tags": ["aws", "serverless"],
        "created_at": "2026-06-14T10:00:00.000Z"
      },
      "highlight": {
        "content": ["...matched <mark>serverless</mark> text..."]
      }
    }
  ]
}
```

### Index a document

```bash
POST /api/index
Content-Type: application/json
```

**Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Document title |
| `content` | string | Yes | Document content |
| `tags` | string[] | No | Array of tags |

**Example:**

```bash
curl -X POST https://aws-open-search-vercel.vercel.app/api/index \
  -H 'Content-Type: application/json' \
  -d '{"title": "Getting Started with Lambda", "content": "AWS Lambda lets you run code without provisioning servers...", "tags": ["aws", "serverless"]}'
```

**Response (201):**

```json
{
  "result": "created",
  "id": "generated-doc-id",
  "index": "documents",
  "embedding": "generated",
  "embeddingError": null
}
```

### Check health

```bash
curl https://aws-open-search-vercel.vercel.app/api/health
```

**Response:**

```json
{
  "connected": true,
  "indices": 1
}
```

### List tags

```bash
curl https://aws-open-search-vercel.vercel.app/api/tags
```

**Response:**

```json
{
  "tags": [
    { "name": "aws", "count": 5 },
    { "name": "serverless", "count": 3 }
  ]
}
```

> **Note:** These endpoints are currently public with no authentication. Anyone can create documents or query the index. For production use, consider adding API key validation, JWT authentication, or placing an API Gateway in front with throttling and usage plans.

## Semantic Search

This application uses **Voyage AI (voyage-4)** via the Vercel AI SDK to generate 1024-dimensional embeddings for semantic and hybrid search.

### How it works

1. **Document indexing** — When a document is created via `/api/index`, an embedding is generated from `title + content` using Voyage AI with `inputType: 'document'` and stored in the `content_embedding` field.
2. **Query time** — When searching in `semantic` or `hybrid` mode, the query is embedded with `inputType: 'query'` and compared against stored document embeddings using dot product (equivalent to cosine similarity since Voyage embeddings are L2-normalized).
3. **Hybrid scoring** — In `hybrid` mode, the final score is a weighted combination: `0.6 × semantic_score + 0.4 × keyword_score (BM25)`.
4. **Fallback** — If embedding generation fails at query time, the search automatically falls back to keyword-only mode.

### Setup

To enable semantic search on a fresh index:

```bash
# Recreate the index with the embedding field mapping
curl -X POST https://aws-open-search-vercel.vercel.app/api/semantic-setup
```

This creates the index with a `content_embedding` field (float array, non-indexed) alongside the standard text fields.

### Configuration

| Constant | Value | Location |
|----------|-------|----------|
| `VOYAGE_MODEL` | `voyage-4` | `lib/constants.ts` |
| `EMBEDDING_DIMENSION` | `1024` | `lib/constants.ts` |

### Environment Variables

The Voyage AI provider requires a `VOYAGE_API_KEY` environment variable. Add it via:

```bash
vercel env add VOYAGE_API_KEY
```

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── create-index/route.ts  — Index creation
│   │   ├── health/route.ts        — Connectivity check
│   │   ├── index/route.ts         — Document indexing + embedding
│   │   ├── mapping/route.ts       — Index mapping inspection
│   │   ├── search/route.ts        — Keyword, semantic & hybrid search
│   │   ├── semantic-setup/route.ts— Recreate index with embedding field
│   │   └── tags/route.ts          — Tag aggregation
│   ├── components/
│   │   ├── ConnectionStatus.tsx
│   │   ├── IndexPanel.tsx
│   │   ├── SearchInterface.tsx
│   │   └── ThemeToggle.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── api-error.ts           — Standardized error responses
│   ├── constants.ts           — Index name, embedding model & dimension
│   ├── embeddings.ts          — Voyage AI embedding generation
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
