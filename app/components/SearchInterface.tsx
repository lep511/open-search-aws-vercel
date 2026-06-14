'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

interface SearchHit {
  id: string
  score: number
  source: Record<string, unknown>
  index: string
}

interface SearchResult {
  total: number
  hits: SearchHit[]
}

export function SearchInterface() {
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState('')
  const [results, setResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (q: string, idx: string) => {
    if (!q.trim() || !idx.trim()) {
      setResults(null)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ q: q.trim(), index: idx.trim() })
      const res = await fetch(`/api/search?${params}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Search failed')
        setResults(null)
      } else {
        setResults(data)
      }
    } catch {
      setError('Network error')
      setResults(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    debounceTimer.current = setTimeout(() => {
      search(query, index)
    }, 300)

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [query, index, search])

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1fr_200px]">
          <div>
            <label htmlFor="search-query" className="block text-sm font-medium text-gray-700">
              Search query
            </label>
            <input
              id="search-query"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter search terms..."
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="search-index" className="block text-sm font-medium text-gray-700">
              Index name
            </label>
            <input
              id="search-index"
              type="text"
              value={index}
              onChange={(e) => setIndex(e.target.value)}
              placeholder="my-index"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center text-gray-500">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
          <span className="ml-2">Searching...</span>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {results && !loading && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Found {results.total} result{results.total !== 1 ? 's' : ''}
          </p>
          {results.hits.length === 0 && (
            <p className="text-center text-gray-400 py-8">No documents match your query.</p>
          )}
          {results.hits.map((hit) => (
            <div
              key={hit.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-xs text-gray-400">{hit.id}</span>
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                  score: {hit.score?.toFixed(3)}
                </span>
              </div>
              <pre className="overflow-x-auto text-sm text-gray-800 whitespace-pre-wrap">
                {JSON.stringify(hit.source, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
