import { NextRequest, NextResponse } from 'next/server'
import { getOpenSearchClient } from '@/lib/opensearch'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const index = searchParams.get('index')

  if (!query) {
    return NextResponse.json(
      { error: 'Missing required query parameter: q' },
      { status: 400 }
    )
  }

  if (!index) {
    return NextResponse.json(
      { error: 'Missing required query parameter: index' },
      { status: 400 }
    )
  }

  try {
    const client = getOpenSearchClient()
    const response = await client.search({
      index,
      body: {
        query: {
          multi_match: {
            query,
            fields: ['*'],
            fuzziness: 'AUTO',
          },
        },
      },
    })

    const hits = response.body.hits
    const total = typeof hits.total === 'object' ? hits.total.value : hits.total
    return NextResponse.json({
      total,
      hits: hits.hits.map((hit: Record<string, unknown>) => ({
        id: hit._id,
        score: hit._score,
        source: hit._source,
        index: hit._index,
      })),
    })
  } catch (error: unknown) {
    const meta = (error as { meta?: { statusCode?: number } }).meta
    if (meta?.statusCode === 404) {
      return NextResponse.json(
        { error: `Index "${index}" not found` },
        { status: 404 }
      )
    }
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Search failed', details: message },
      { status: 500 }
    )
  }
}
