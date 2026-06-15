import { NextRequest, NextResponse } from 'next/server'
import getClient from '@/lib/opensearch'
import { INDEX_NAME } from '@/lib/constants'
import { errorResponse, validationError } from '@/lib/api-error'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!id) {
    return validationError('Missing document id')
  }

  try {
    const client = getClient()

    const response = await client.delete({
      index: INDEX_NAME,
      id,
    })

    return NextResponse.json({
      result: response.body.result,
      id: response.body._id,
    })
  } catch (error: unknown) {
    const meta = (error as { meta?: { statusCode?: number } }).meta
    if (meta?.statusCode === 404) {
      return NextResponse.json(
        { error: 'Document not found', id },
        { status: 404 }
      )
    }
    return errorResponse('Delete failed', error)
  }
}
