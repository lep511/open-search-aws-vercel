import { NextResponse } from 'next/server'
import getClient from '@/lib/opensearch'
import { INDEX_NAME, EMBEDDING_DIMENSION } from '@/lib/constants'
import { errorResponse } from '@/lib/api-error'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const client = getClient()

    const indexExists = await client.indices.exists({ index: INDEX_NAME })
    if (indexExists.body) {
      await client.indices.delete({ index: INDEX_NAME })
    }

    await client.indices.create({
      index: INDEX_NAME,
      body: {
        mappings: {
          properties: {
            title: { type: 'text' },
            content: { type: 'text' },
            tags: { type: 'text', fields: { keyword: { type: 'keyword' } } },
            created_at: { type: 'date' },
            content_embedding: { type: 'float', index: false },
          },
        },
      },
    })

    return NextResponse.json({ status: 'created', message: 'Index recreated with embedding field' }, { status: 201 })
  } catch (error: unknown) {
    return errorResponse('Semantic setup failed', error)
  }
}
