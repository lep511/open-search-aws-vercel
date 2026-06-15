# PDF Ingestion

Extracts text from PDF files using [pdfmux](https://pypi.org/project/pdfmux/) and uploads them as documents via the `/api/index` endpoint.

## Setup

```bash
cd scripts/pdf-ingestion
uv sync
```

## Usage

```bash
# Ingest a single PDF
uv run python ingest.py ./my-document.pdf

# Ingest all PDFs in a directory (recursive)
uv run python ingest.py ./pdfs/

# Use a custom API URL (e.g. local dev)
uv run python ingest.py ./pdfs/ --api-url http://localhost:3000

# Add tags to all ingested documents
uv run python ingest.py ./pdfs/ --tags research,science,2026

# Split large PDFs into chunks for better search granularity
uv run python ingest.py ./pdfs/ --chunk --max-tokens 500

# Fast extraction (no OCR)
uv run python ingest.py ./pdfs/ --quality fast

# High quality extraction (LLM-assisted, slower)
uv run python ingest.py ./pdfs/ --quality high
```

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `path` | (required) | PDF file or directory |
| `--api-url` | `https://aws-open-search-vercel.vercel.app` | API base URL |
| `--tags` | (none) | Comma-separated tags for all documents |
| `--chunk` | off | Split PDFs into smaller chunks |
| `--max-tokens` | 500 | Max tokens per chunk (with `--chunk`) |
| `--quality` | standard | Extraction quality: `fast`, `standard`, `high` |

## How it works

1. Reads PDF files using `pdfmux.extract_text()` (standard quality by default)
2. Extracts the title from the first line of content, or derives it from the filename
3. Uploads each document (or chunk) to `/api/index` with the specified tags
4. The API generates a Voyage AI embedding automatically for semantic search

## Chunking mode

With `--chunk`, large PDFs are split into smaller pieces using `pdfmux.chunk()`. Each chunk becomes a separate document with:
- Title: `filename - chunk title` (or `filename (part N/M)`)
- Tags: user-provided tags + the filename stem
