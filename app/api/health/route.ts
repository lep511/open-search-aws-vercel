import { NextResponse } from 'next/server'
import getClient from '@/lib/opensearch'

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
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        status: 'unhealthy',
        connected: false,
        error: message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
