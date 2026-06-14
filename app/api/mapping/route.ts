import { NextResponse } from 'next/server'
import getClient from '@/lib/opensearch'
import { INDEX_NAME } from '@/lib/constants'
import { errorResponse } from '@/lib/api-error'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const client = getClient()
    const mapping = await client.indices.getMapping({ index: INDEX_NAME })
    return NextResponse.json(mapping.body)
  } catch (error: unknown) {
    return errorResponse('Failed to get mapping', error)
  }
}
