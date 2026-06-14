'use client'

import { useState } from 'react'

export function IndexPanel() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'loading'; message: string } | null>(null)

  function addTag() {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !tags.includes(tag)) setTags([...tags, tag])
    setTagInput('')
  }

  function removeTag(tag: string) {
    setTags(tags.filter(t => t !== tag))
  }

  function handleTagKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    const docTitle = title.trim()
    const docContent = content.trim()
    const docTags = [...tags]

    setOpen(false)
    setTitle('')
    setContent('')
    setTags([])
    setTagInput('')
    setToast({ type: 'loading', message: `Indexing "${docTitle}" — generating embedding...` })

    try {
      const res = await fetch('/api/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: docTitle, content: docContent, tags: docTags }),
      })
      const data = await res.json()
      if (!res.ok) {
        const detail = data.opensearchError
          ? JSON.stringify(data.opensearchError, null, 2)
          : data.details || data.error
        setToast({ type: 'error', message: detail })
      } else if (data.embedding === 'failed') {
        setToast({ type: 'error', message: `"${docTitle}" indexed but embedding failed: ${data.embeddingError}` })
        window.dispatchEvent(new Event('document-indexed'))
      } else {
        setToast({ type: 'success', message: `"${docTitle}" indexed with semantic embedding ✓` })
        window.dispatchEvent(new Event('document-indexed'))
      }
    } catch {
      setToast({ type: 'error', message: 'Network error' })
    }

    setTimeout(() => setToast(null), 3000)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="surface rounded-full px-4 py-2 text-xs font-medium tracking-wide transition-opacity hover:opacity-70"
      >
        + New
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/60 backdrop-blur-sm">
          <div className="surface mx-4 w-full max-w-lg rounded-2xl p-8 shadow-2xl">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-xl font-semibold">New Document</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="doc-title" className="block text-xs font-medium uppercase tracking-widest text-[var(--text-secondary)] mb-3">
                  Title
                </label>
                <div className="surface rounded-xl px-4 py-3">
                  <input
                    id="doc-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Document title"
                    className="block w-full bg-transparent text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label htmlFor="doc-content" className="block text-xs font-medium uppercase tracking-widest text-[var(--text-secondary)] mb-3">
                  Content
                </label>
                <div className="surface rounded-xl px-4 py-3">
                  <textarea
                    id="doc-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your content..."
                    rows={4}
                    className="block w-full bg-transparent text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none text-sm leading-relaxed resize-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="doc-tags" className="block text-xs font-medium uppercase tracking-widest text-[var(--text-secondary)] mb-3">
                  Tags
                </label>
                <div className="surface rounded-xl px-4 py-3">
                  <input
                    id="doc-tags"
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Press enter to add"
                    className="block w-full bg-transparent text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none text-sm"
                  />
                </div>
                {tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--surface-border)] px-3 py-1 text-xs text-[var(--text-secondary)]"
                      >
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="hover:text-[var(--text)]">&times;</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || !content.trim()}
                  className="rounded-full bg-[var(--accent)] px-6 py-2.5 text-xs font-medium tracking-wide text-[var(--bg)] disabled:opacity-30 transition-opacity hover:opacity-80"
                >
                  Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-8 right-8 z-50">
          <div className={`surface rounded-2xl px-6 py-4 text-sm tracking-wide shadow-xl ${
            toast.type === 'error' ? 'text-red-500' : 'text-[var(--text)]'
          }`}>
            <div className="flex items-center gap-3">
              {toast.type === 'loading' && (
                <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[var(--text-muted)] border-t-[var(--text)]" />
              )}
              {toast.type === 'success' && (
                <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              <span className="font-medium">{toast.message}</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
