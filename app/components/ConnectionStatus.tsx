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

  const colors = {
    checking: 'bg-yellow-400',
    connected: 'bg-green-400',
    disconnected: 'bg-red-400',
  }

  return (
    <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${colors[status]}`} />
      <span>
        {status === 'checking' && 'Checking connection...'}
        {status === 'connected' && `Connected to OpenSearch (${details})`}
        {status === 'disconnected' && `Disconnected: ${details}`}
      </span>
    </div>
  )
}
