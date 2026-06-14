import { NextResponse } from 'next/server'
import getClient from '@/lib/opensearch'
import { INDEX_NAME } from '@/lib/constants'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const client = getClient()
    const mapping = await client.indices.getMapping({ index: INDEX_NAME })
    return NextResponse.json(mapping.body)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
