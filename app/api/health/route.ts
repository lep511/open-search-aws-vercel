import { NextResponse } from 'next/server'
import getClient from '@/lib/opensearch'
import { classifyError } from '@/lib/api-error'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const client = getClient()
    const response = await client.cat.indices({ format: 'json' })
    return NextResponse.json({
      status: 'healthy',
      connected: true,
      indices: Array.isArray(response.body) ? response.body.length : 0,
      timestamp: new Date().toISOString(),
    })
  } catch (error: unknown) {
    const classified = classifyError(error)
    console.error(JSON.stringify({ error: 'Health check failed', code: classified.code, details: classified.details }))
    return NextResponse.json(
      {
        status: 'unhealthy',
        connected: false,
        error: classified.details,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
