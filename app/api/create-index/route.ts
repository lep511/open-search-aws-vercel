import { NextRequest, NextResponse } from 'next/server'
import getClient from '@/lib/opensearch'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  let body: { index: string; mappings?: Record<string, unknown> }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { index, mappings } = body

  if (!index) {
    return NextResponse.json({ error: 'Missing required field: index' }, { status: 400 })
  }

  try {
    const client = getClient()
    const response = await client.indices.create({
      index,
      body: mappings ? { mappings } : undefined,
    })

    return NextResponse.json({
      acknowledged: response.body.acknowledged,
      index: response.body.index,
    }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to create index', details: message }, { status: 500 })
  }
}
