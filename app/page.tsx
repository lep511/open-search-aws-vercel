import { SearchInterface } from './components/SearchInterface'
import { ConnectionStatus } from './components/ConnectionStatus'

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          OpenSearch Explorer
        </h1>
        <p className="mt-2 text-gray-600">
          Search and index documents in AWS OpenSearch Serverless
        </p>
        <ConnectionStatus />
      </header>
      <SearchInterface />
    </main>
  )
}
