import { NextResponse } from 'next/server'
import getClient from '@/lib/opensearch'
import { INDEX_NAME } from '@/lib/constants'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const client = getClient()

    const response = await client.search({
      index: INDEX_NAME,
      body: {
        size: 0,
        aggs: {
          all_tags: {
            terms: { field: 'tags.keyword', size: 50 },
          },
        },
      },
    } as Parameters<typeof client.search>[0])

    const aggs = response.body.aggregations as Record<string, { buckets?: { key: string; doc_count: number }[] }> | undefined
    const buckets = aggs?.all_tags?.buckets ?? []
    const tags = buckets.map((b: { key: string; doc_count: number }) => ({
      name: b.key,
      count: b.doc_count,
    }))

    return NextResponse.json({ tags })
  } catch (error: unknown) {
    const meta = (error as { meta?: { statusCode?: number } }).meta
    if (meta?.statusCode === 404) {
      return NextResponse.json({ tags: [] })
    }
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message, tags: [] }, { status: 500 })
  }
}
