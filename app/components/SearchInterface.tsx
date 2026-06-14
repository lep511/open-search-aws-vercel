'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import DOMPurify from 'dompurify'

interface SearchHit {
  id: string
  score: number
  source: { title: string; content: string; tags?: string[]; created_at: string }
  highlight?: { title?: string[]; content?: string[] } | null
}

interface SearchResult {
  total: number
  hits: SearchHit[]
}

function HighlightedText({ html }: { html: string }) {
  const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS: ['mark'] })
  return <span dangerouslySetInnerHTML={{ __html: clean }} />
}

function truncate(text: string, maxLen: number) {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen).trimEnd() + '...'
}

type SearchMode = 'keyword' | 'semantic' | 'hybrid'

export function SearchInterface() {
  const [query, setQuery] = useState('')
  const [searchMode, setSearchMode] = useState<SearchMode>('hybrid')
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<{ name: string; count: number }[]>([])
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false)
  const [tagSearch, setTagSearch] = useState('')
  const [results, setResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDoc, setSelectedDoc] = useState<SearchHit | null>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tagDropdownRef = useRef<HTMLDivElement>(null)

  function refreshTags() {
    fetch('/api/tags')
      .then(r => {
        if (!r.ok) throw new Error(`Tags fetch failed: ${r.status}`)
        return r.json()
      })
      .then(data => setAvailableTags(data.tags ?? []))
      .catch((err) => console.error('Failed to load tags:', err))
  }

  function onDocumentIndexed() {
    setTimeout(() => {
      refreshTags()
      search(query, activeTags, searchMode)
    }, 1500)
  }

  useEffect(() => {
    refreshTags()
    window.addEventListener('document-indexed', onDocumentIndexed)
    return () => window.removeEventListener('document-indexed', onDocumentIndexed)
  }, [])

  const search = useCallback(async (q: string, tags: string[], mode: SearchMode = 'hybrid') => {
    if (!q.trim() && tags.length === 0) {
      setResults(null)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q.trim())
      if (tags.length > 0) params.set('tag', tags.join(','))
      params.set('mode', mode)

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
    if (searchMode !== 'keyword') return
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => search(query, activeTags, searchMode), 300)
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current) }
  }, [query, activeTags, searchMode, search])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (searchMode === 'semantic' || searchMode === 'hybrid')) {
      search(query, activeTags, searchMode)
    }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
        setTagDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (selectedDoc) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [selectedDoc])

  function toggleTag(tag: string) {
    setActiveTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  return (
    <div className="space-y-10">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-medium uppercase tracking-widest text-[var(--text-secondary)]">
            Search
          </label>
          <div className="flex items-center gap-1 rounded-full border border-[var(--surface-border)] p-1">
            {(['keyword', 'semantic', 'hybrid'] as SearchMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setSearchMode(mode)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  searchMode === mode
                    ? 'bg-[var(--text)] text-[var(--bg)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {mode === 'keyword' ? 'Keyword' : mode === 'semantic' ? 'Semantic' : 'Hybrid'}
              </button>
            ))}
          </div>
        </div>
        <div className="surface rounded-xl px-5 py-4 shadow-md ring-1 ring-[var(--surface-border)]">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={searchMode === 'keyword' ? 'Type to search documents...' : 'Type and press Enter to search...'}
            className="block w-full bg-transparent text-lg font-medium text-[var(--text)] placeholder:text-[var(--text-muted)] placeholder:font-normal focus:outline-none"
          />
        </div>

        {availableTags.length > 0 && (
          <div className="pt-2 relative" ref={tagDropdownRef}>
            <span className="block text-xs font-medium uppercase tracking-widest text-[var(--text-secondary)] mb-3">
              Filter by tags
            </span>

            {activeTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {activeTags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--text)] text-[var(--bg)] px-3 py-1.5 text-xs tracking-wide"
                  >
                    {tag}
                    <button onClick={() => toggleTag(tag)} className="opacity-60 hover:opacity-100">&times;</button>
                  </span>
                ))}
                <button
                  onClick={() => setActiveTags([])}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors underline underline-offset-4"
                >
                  clear all
                </button>
              </div>
            )}

            <button
              onClick={() => { setTagDropdownOpen(!tagDropdownOpen); setTagSearch('') }}
              className="surface rounded-xl px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Select tags
              <svg className={`h-3 w-3 transition-transform ${tagDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {tagDropdownOpen && (
              <div className="absolute z-40 mt-2 w-64 rounded-xl bg-white dark:bg-[#141414] border border-[var(--surface-border)] shadow-xl overflow-hidden">
                <div className="p-3 border-b border-[var(--surface-border)]">
                  <input
                    type="text"
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    placeholder="Search tags..."
                    className="block w-full bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none"
                    autoFocus
                  />
                </div>
                <div className="max-h-48 overflow-y-auto py-1">
                  {availableTags
                    .filter(tag => tag.name.includes(tagSearch.toLowerCase()))
                    .map(tag => (
                      <button
                        key={tag.name}
                        onClick={() => { toggleTag(tag.name); setTagDropdownOpen(false); setTagSearch('') }}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-[var(--surface-border)] transition-colors"
                      >
                        <span className={activeTags.includes(tag.name) ? 'font-medium text-[var(--text)]' : 'text-[var(--text-secondary)]'}>
                          {tag.name}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="text-xs text-[var(--text-muted)]">{tag.count}</span>
                          {activeTags.includes(tag.name) && (
                            <svg className="h-4 w-4 text-[var(--text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                      </button>
                    ))}
                  {availableTags.filter(tag => tag.name.includes(tagSearch.toLowerCase())).length === 0 && (
                    <p className="px-4 py-3 text-xs text-[var(--text-muted)]">No tags found</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] tracking-wide">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border border-[var(--text-muted)] border-t-[var(--text)]" />
          Searching...
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {results && !loading && (
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--text-secondary)] mb-6">
            {results.total} result{results.total !== 1 ? 's' : ''}
          </p>

          {results.hits.length === 0 && (
            <p className="py-12 text-center text-sm text-[var(--text-muted)]">
              No documents found.
            </p>
          )}

          <div className="space-y-4">
            {results.hits.map((hit) => {
              const maxScore = results.hits[0]?.score || 1
              const percent = Math.round((hit.score / maxScore) * 100)
              const highlightedTitle = hit.highlight?.title?.[0]
              const highlightedContent = hit.highlight?.content?.join(' ... ')
              const displayContent = highlightedContent || truncate(hit.source.content, 200)

              return (
                <article key={hit.id} className="surface rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-base font-semibold [&_mark]:bg-[#bbf7d0] [&_mark]:dark:bg-[#22c55e33] [&_mark]:text-[var(--text)] [&_mark]:rounded-sm [&_mark]:px-0.5 [&_mark]:no-underline">
                      {highlightedTitle ? <HighlightedText html={highlightedTitle} /> : hit.source.title}
                    </h3>
                    <button
                      onClick={() => setSelectedDoc(hit)}
                      className="shrink-0 text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors underline underline-offset-4"
                    >
                      read
                    </button>
                  </div>
                  <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-3 [&_mark]:bg-[#bbf7d0] [&_mark]:dark:bg-[#22c55e33] [&_mark]:text-[var(--text)] [&_mark]:rounded-sm [&_mark]:px-0.5 [&_mark]:no-underline [&_mark]:font-medium">
                    <HighlightedText html={displayContent} />
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    {hit.source.tags && hit.source.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {hit.source.tags.map(tag => (
                          <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={`rounded-full px-2.5 py-0.5 text-xs tracking-wide transition-all ${
                              activeTags.includes(tag)
                                ? 'bg-[var(--text)] text-[var(--bg)]'
                                : 'border border-[var(--surface-border)] text-[var(--text-muted)] hover:text-[var(--text)]'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    )}
                    <span className="text-xs text-[var(--text-muted)] tabular-nums ml-auto">
                      {hit.score > 0 && `${percent}% · `}
                      {new Date(hit.source.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      )}

      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg)]/90 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl shadow-2xl bg-white dark:bg-[#141414] border border-[var(--surface-border)]">
            <div className="shrink-0 flex items-center justify-between border-b border-[var(--surface-border)] px-8 py-6">
              <h2 className="text-xl font-semibold">{selectedDoc.source.title}</h2>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
              <p className="whitespace-pre-wrap text-sm text-[var(--text-secondary)] leading-[1.9]">
                {selectedDoc.source.content}
              </p>
            </div>
            <div className="shrink-0 border-t border-[var(--surface-border)] px-8 py-4 flex items-center justify-between text-[10px] text-[var(--text-muted)] tracking-wide">
              <div className="flex flex-wrap gap-2">
                {selectedDoc.source.tags?.map(tag => (
                  <span key={tag} className="border border-[var(--surface-border)] rounded-full px-2.5 py-0.5">
                    {tag}
                  </span>
                ))}
              </div>
              <span>{new Date(selectedDoc.source.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
