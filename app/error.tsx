'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Page error:', error)
  }, [error])

  return (
    <main className="relative z-10 mx-auto max-w-3xl px-6 py-16">
      <div className="surface rounded-2xl p-8 text-center">
        <h2 className="text-xl font-semibold mb-3">Something went wrong</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <button
          onClick={reset}
          className="rounded-full bg-[var(--accent)] px-6 py-2.5 text-xs font-medium tracking-wide text-[var(--bg)] transition-opacity hover:opacity-80"
        >
          Try again
        </button>
      </div>
    </main>
  )
}
