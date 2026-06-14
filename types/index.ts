export interface SearchHit {
  id: string
  score: number
  source: Record<string, unknown>
  index: string
}

export interface SearchResponse {
  total: number
  hits: SearchHit[]
}

export interface IndexRequest {
  index: string
  document: Record<string, unknown>
  id?: string
}

export interface IndexResponse {
  result: string
  id: string
  index: string
  version: number
}

export interface HealthResponse {
  status: 'healthy' | 'unhealthy'
  connected: boolean
  indices?: number
  error?: string
  timestamp: string
}
