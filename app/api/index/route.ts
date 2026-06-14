import { NextRequest, NextResponse } from 'next/server'
import getClient from '@/lib/opensearch'
import { INDEX_NAME } from '@/lib/constants'
import { generateDocumentEmbedding } from '@/lib/embeddings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  let body: { title?: string; content?: string; tags?: string[] }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { title, content, tags } = body

  if (!title || !content) {
    return NextResponse.json(
      { error: 'Missing required fields: title, content' },
      { status: 400 }
    )
  }

  try {
    const client = getClient()
    const textForEmbedding = `${title} ${content}`
    let content_embedding: number[] | undefined
    let embeddingError: string | null = null
    try {
      content_embedding = await generateDocumentEmbedding(textForEmbedding)
    } catch (err: unknown) {
      embeddingError = err instanceof Error ? err.message : 'Embedding generation failed'
      console.error('Embedding error:', embeddingError)
    }

    const doc: Record<string, unknown> = {
      title,
      content,
      tags: tags ?? [],
      created_at: new Date().toISOString(),
    }
    if (content_embedding) {
      doc.content_embedding = content_embedding
    }

    const response = await client.index({
      index: INDEX_NAME,
      body: doc,
    })

    return NextResponse.json(
      {
        result: response.body.result,
        id: response.body._id,
        index: response.body._index,
        embedding: content_embedding ? 'generated' : 'failed',
        embeddingError,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    const meta = (error as { meta?: { body?: unknown; statusCode?: number } }).meta
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Index error full:', JSON.stringify({ message, meta: meta?.body, status: meta?.statusCode }))
    return NextResponse.json(
      {
        error: 'Indexing failed',
        details: message,
        opensearchError: meta?.body ?? null,
        statusCode: meta?.statusCode ?? null,
      },
      { status: 500 }
    )
  }
}
