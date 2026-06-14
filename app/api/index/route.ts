import { NextRequest, NextResponse } from 'next/server'
import { getOpenSearchClient } from '@/lib/opensearch'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface IndexRequestBody {
  index: string
  document: Record<string, unknown>
  id?: string
}

export async function POST(request: NextRequest) {
  let body: IndexRequestBody

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const { index, document, id } = body

  if (!index || !document) {
    return NextResponse.json(
      { error: 'Missing required fields: index, document' },
      { status: 400 }
    )
  }

  try {
    const client = getOpenSearchClient()
    const response = await client.index({
      index,
      id,
      body: document,
      refresh: 'wait_for',
    })

    return NextResponse.json(
      {
        result: response.body.result,
        id: response.body._id,
        index: response.body._index,
        version: response.body._version,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Indexing failed', details: message },
      { status: 500 }
    )
  }
}
