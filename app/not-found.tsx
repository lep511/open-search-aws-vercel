import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="relative z-10 mx-auto max-w-3xl px-6 py-16">
      <div className="surface rounded-2xl p-8 text-center">
        <h2 className="text-xl font-semibold mb-3">Page not found</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          The page you are looking for does not exist.
        </p>
        <Link
          href="/"
          className="rounded-full bg-[var(--accent)] px-6 py-2.5 text-xs font-medium tracking-wide text-[var(--bg)] transition-opacity hover:opacity-80"
        >
          Go home
        </Link>
      </div>
    </main>
  )
}
