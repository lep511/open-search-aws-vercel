import { voyage } from 'voyage-ai-provider'
import { embedMany, embed } from 'ai'
import { VOYAGE_MODEL } from './constants'

const model = voyage.textEmbeddingModel(VOYAGE_MODEL)

export async function generateDocumentEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model,
    value: text,
    providerOptions: { voyage: { inputType: 'document' } },
  })
  return embedding
}

export async function generateDocumentEmbeddings(texts: string[]): Promise<number[][]> {
  const { embeddings } = await embedMany({
    model,
    values: texts,
    providerOptions: { voyage: { inputType: 'document' } },
  })
  return embeddings
}

export async function generateQueryEmbedding(query: string): Promise<number[]> {
  const { embedding } = await embed({
    model,
    value: query,
    providerOptions: { voyage: { inputType: 'query' } },
  })
  return embedding
}

// Voyage embeddings are normalized to length 1, so dot product = cosine similarity
export function dotProduct(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i]
  }
  return sum
}
