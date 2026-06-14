'use client'

import { useEffect, useState } from 'react'

type Status = 'checking' | 'connected' | 'disconnected'

export function ConnectionStatus() {
  const [status, setStatus] = useState<Status>('checking')
  const [details, setDetails] = useState('')

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch('/api/health')
        const data = await res.json()
        setStatus(data.connected ? 'connected' : 'disconnected')
        setDetails(data.connected ? `${data.indices} indices` : data.error)
      } catch {
        setStatus('disconnected')
        setDetails('Network error')
      }
    }
    check()
  }, [])

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
    </div>
  )
}
