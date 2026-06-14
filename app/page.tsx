import { SearchInterface } from './components/SearchInterface'
import { ConnectionStatus } from './components/ConnectionStatus'
import { IndexPanel } from './components/IndexPanel'
import { ThemeToggle } from './components/ThemeToggle'

export default function Home() {
  return (
    <main className="relative z-10 mx-auto max-w-3xl px-6 py-16">
      <header className="mb-14">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">
              Explorer
            </h1>
            <p className="mt-3 text-[var(--text-secondary)] font-light tracking-wide text-sm">
              Search &amp; index documents
            </p>
            <ConnectionStatus />
          </div>
          <div className="flex items-center gap-3">
            <IndexPanel />
            <ThemeToggle />
          </div>
        </div>
        <div className="mt-8 h-px bg-[var(--surface-border)]" />
      </header>
      <SearchInterface />
    </main>
  )
}
