'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

type Status = 'checking' | 'connected' | 'disconnected'

const MAX_RETRIES = 3

export function ConnectionStatus() {
  const [status, setStatus] = useState<Status>('checking')
  const [details, setDetails] = useState('')
  const retryCount = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const check = useCallback(async () => {
    try {
      const res = await fetch('/api/health')
      const data = await res.json()
      if (data.connected) {
        setStatus('connected')
        setDetails(`${data.indices} indices`)
        retryCount.current = 0
      } else {
        throw new Error(data.error || 'Not connected')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error'
      if (retryCount.current < MAX_RETRIES) {
        retryCount.current++
        const delay = Math.pow(2, retryCount.current) * 1000
        timeoutRef.current = setTimeout(check, delay)
      } else {
        setStatus('disconnected')
        setDetails(message)
      }
    }
  }, [])

  function retry() {
    retryCount.current = 0
    setStatus('checking')
    setDetails('')
    check()
  }

  useEffect(() => {
    check()
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [check])

  return (
    <div className="mt-3 flex items-center gap-2 text-xs text-[var(--text-muted)] tracking-wide">
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${
        status === 'checking' ? 'bg-[var(--text-muted)] animate-pulse' :
        status === 'connected' ? 'bg-emerald-500' : 'bg-red-500'
      }`} />
      <span>
        {status === 'checking' && 'Connecting...'}
        {status === 'connected' && `Connected (${details})`}
        {status === 'disconnected' && `Disconnected: ${details}`}
      </span>
      {status === 'disconnected' && (
        <button
          onClick={retry}
          className="underline underline-offset-2 hover:text-[var(--text)] transition-colors"
        >
          retry
        </button>
      )}
    </div>
  )
}
