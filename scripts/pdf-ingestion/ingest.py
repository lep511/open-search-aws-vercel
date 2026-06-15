"""
PDF Ingestion Script
Reads PDF files and uploads them as documents via the /api/index endpoint.

Usage:
    uv run python ingest.py ./pdfs/
    uv run python ingest.py ./pdfs/ --api-url http://localhost:3000
    uv run python ingest.py report.pdf --tags research,science
    uv run python ingest.py ./pdfs/ --chunk --max-tokens 500
"""

import argparse
import sys
from pathlib import Path

import httpx
import pdfmux


DEFAULT_API_URL = "https://aws-open-search-vercel.vercel.app"


def extract_title(path: Path, text: str) -> str:
    first_line = text.strip().split("\n")[0] if text.strip() else ""
    title = first_line.strip("#").strip()
    if len(title) > 5 and len(title) < 200:
        return title
    return path.stem.replace("_", " ").replace("-", " ").title()


def upload_document(client: httpx.Client, api_url: str, title: str, content: str, tags: list[str]) -> dict:
    response = client.post(
        f"{api_url}/api/index",
        json={"title": title, "content": content, "tags": tags},
        timeout=30.0,
    )
    return {"status": response.status_code, "body": response.json()}


def ingest_file(client: httpx.Client, path: Path, api_url: str, tags: list[str], chunk: bool, max_tokens: int):
    print(f"\n{'='*60}")
    print(f"Processing: {path.name}")
    print(f"{'='*60}")

    try:
        if chunk:
            chunks = pdfmux.chunk(str(path), max_tokens=max_tokens)
            total = len(chunks)
            print(f"  Split into {total} chunks (max {max_tokens} tokens each)")

            for i, c in enumerate(chunks, 1):
                title = f"{path.stem} - {c['title']}" if c.get("title") else f"{path.stem} (part {i}/{total})"
                doc_tags = tags + [path.stem.lower()]
                result = upload_document(client, api_url, title, c["text"], doc_tags)

                if result["status"] == 201:
                    embedding = result["body"].get("embedding", "unknown")
                    print(f"  [{i}/{total}] OK - {title} (embedding: {embedding})")
                else:
                    print(f"  [{i}/{total}] FAIL ({result['status']}): {result['body']}")
        else:
            text = pdfmux.extract_text(str(path), quality="standard")

            if not text or not text.strip():
                print(f"  SKIP - No text extracted")
                return False

            title = extract_title(path, text)
            doc_tags = tags + [path.stem.lower()]
            result = upload_document(client, api_url, title, text, doc_tags)

            if result["status"] == 201:
                embedding = result["body"].get("embedding", "unknown")
                print(f"  OK - \"{title}\" ({len(text)} chars, embedding: {embedding})")
            else:
                print(f"  FAIL ({result['status']}): {result['body']}")
                return False

    except pdfmux.FileError as e:
        print(f"  ERROR - Cannot read file: {e}")
        return False
    except pdfmux.ExtractionError as e:
        print(f"  ERROR - Extraction failed: {e}")
        return False
    except httpx.HTTPError as e:
        print(f"  ERROR - Network error: {e}")
        return False

    return True


def main():
    parser = argparse.ArgumentParser(description="Ingest PDF files into OpenSearch via API")
    parser.add_argument("path", help="PDF file or directory containing PDFs")
    parser.add_argument("--api-url", default=DEFAULT_API_URL, help=f"API base URL (default: {DEFAULT_API_URL})")
    parser.add_argument("--tags", default="", help="Comma-separated tags to apply to all documents")
    parser.add_argument("--chunk", action="store_true", help="Split PDFs into chunks for better search")
    parser.add_argument("--max-tokens", type=int, default=500, help="Max tokens per chunk (default: 500)")
    parser.add_argument("--quality", choices=["fast", "standard", "high"], default="standard", help="Extraction quality (default: standard)")

    args = parser.parse_args()
    target = Path(args.path)
    tags = [t.strip() for t in args.tags.split(",") if t.strip()] if args.tags else []

    if not target.exists():
        print(f"Error: {target} does not exist")
        sys.exit(1)

    if target.is_file():
        if target.suffix.lower() != ".pdf":
            print(f"Error: {target} is not a PDF file")
            sys.exit(1)
        pdf_files = [target]
    else:
        pdf_files = sorted(target.glob("**/*.pdf"))
        if not pdf_files:
            print(f"Error: No PDF files found in {target}")
            sys.exit(1)

    print(f"PDF Ingestion")
    print(f"  API:    {args.api_url}")
    print(f"  Files:  {len(pdf_files)}")
    print(f"  Tags:   {tags or '(none)'}")
    print(f"  Mode:   {'chunked (' + str(args.max_tokens) + ' tokens)' if args.chunk else 'full document'}")

    success = 0
    failed = 0

    with httpx.Client() as client:
        # Verify API is reachable
        try:
            health = client.get(f"{args.api_url}/api/health", timeout=10.0)
            if health.status_code == 200:
                data = health.json()
                if data.get("connected"):
                    print(f"  Status: Connected ({data.get('indices', '?')} indices)")
                else:
                    print(f"  Status: API reachable but OpenSearch disconnected")
                    sys.exit(1)
            else:
                print(f"  Status: API returned {health.status_code}")
                sys.exit(1)
        except httpx.HTTPError as e:
            print(f"  Status: Cannot reach API - {e}")
            sys.exit(1)

        for pdf in pdf_files:
            if ingest_file(client, pdf, args.api_url, tags, args.chunk, args.max_tokens):
                success += 1
            else:
                failed += 1

    print(f"\n{'='*60}")
    print(f"Done! {success} succeeded, {failed} failed out of {len(pdf_files)} files.")


if __name__ == "__main__":
    main()
