import { NextRequest, NextResponse } from 'next/server'
import getClient from '@/lib/opensearch'
import { errorResponse, validationError } from '@/lib/api-error'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  let body: { index: string; mappings?: Record<string, unknown> }

  try {
    body = await request.json()
  } catch {
    return validationError('Invalid JSON body')
  }

  const { index, mappings } = body

  if (!index) {
    return validationError('Missing required field: index')
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
    return errorResponse('Failed to create index', error)
  }
}
