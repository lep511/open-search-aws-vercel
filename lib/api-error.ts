import { NextResponse } from 'next/server'

type ErrorCode = 'VALIDATION_ERROR' | 'OPENSEARCH_ERROR' | 'NETWORK_ERROR' | 'INTERNAL_ERROR'

interface ClassifiedError {
  code: ErrorCode
  status: number
  details: string
}

export function classifyError(error: unknown): ClassifiedError {
  const meta = (error as { meta?: { statusCode?: number; body?: unknown } }).meta
  const cause = (error as { cause?: { code?: string } }).cause
  const message = error instanceof Error ? error.message : 'Unknown error'

  if (meta?.statusCode) {
    return {
      code: 'OPENSEARCH_ERROR',
      status: meta.statusCode >= 500 ? 502 : 500,
      details: meta.body ? JSON.stringify(meta.body) : message,
    }
  }

  if (cause?.code === 'ECONNREFUSED' || cause?.code === 'ENOTFOUND' || cause?.code === 'ETIMEDOUT') {
    return {
      code: 'NETWORK_ERROR',
      status: 503,
      details: message,
    }
  }

  return {
    code: 'INTERNAL_ERROR',
    status: 500,
    details: message,
  }
}

export function errorResponse(summary: string, error: unknown, overrideStatus?: number): NextResponse {
  const classified = classifyError(error)
  const status = overrideStatus ?? classified.status

  console.error(JSON.stringify({
    error: summary,
    code: classified.code,
    details: classified.details,
    timestamp: new Date().toISOString(),
  }))

  return NextResponse.json(
    {
      error: summary,
      code: classified.code,
      details: classified.details,
      timestamp: new Date().toISOString(),
    },
    { status }
  )
}

export function validationError(message: string): NextResponse {
  return NextResponse.json(
    {
      error: message,
      code: 'VALIDATION_ERROR' as ErrorCode,
      details: message,
      timestamp: new Date().toISOString(),
    },
    { status: 400 }
  )
}
