import { NextRequest, NextResponse } from 'next/server'
import getClient from '@/lib/opensearch'
import { INDEX_NAME } from '@/lib/constants'
import { generateQueryEmbedding, dotProduct } from '@/lib/embeddings'
import { errorResponse, validationError } from '@/lib/api-error'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type SearchMode = 'keyword' | 'semantic' | 'hybrid'

interface HitSource {
  title: string
  content: string
  tags?: string[]
  created_at: string
  content_embedding?: number[]
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const tag = searchParams.get('tag')
  const mode = (searchParams.get('mode') || 'hybrid') as SearchMode

  if (!query && !tag) {
    return validationError('Missing query parameter: q or tag')
  }

  try {
    const client = getClient()

    const filter: Record<string, unknown>[] = []

    if (tag) {
      const tags = tag.split(',').map(t => t.trim()).filter(Boolean)
      if (tags.length === 1) {
        filter.push({ term: { 'tags.keyword': tags[0] } })
      } else if (tags.length > 1) {
        filter.push({ terms: { 'tags.keyword': tags } })
      }
    }

    if (!query) {
      const searchBody: Record<string, unknown> = {
        size: 50,
        query: {
          bool: {
            must: [{ match_all: {} }],
            ...(filter.length > 0 ? { filter } : {}),
          },
        },
        sort: [{ created_at: { order: 'desc' } }],
      }

      const response = await client.search({
        index: INDEX_NAME,
        body: searchBody,
      } as Parameters<typeof client.search>[0])

      const hits = response.body.hits
      const total = typeof hits.total === 'object' ? hits.total.value : hits.total
      return NextResponse.json({
        total,
        mode,
        hits: hits.hits.map((hit: Record<string, unknown>) => {
          const source = hit._source as HitSource
          const { content_embedding: _, ...sourceWithoutEmbedding } = source
          return {
            id: hit._id,
            score: hit._score,
            source: sourceWithoutEmbedding,
            highlight: hit.highlight ?? null,
          }
        }),
      })
    }

    if (mode === 'keyword') {
      const searchBody = {
        size: 10,
        query: {
          bool: {
            must: [{
              multi_match: {
                query,
                fields: ['title^2', 'content'],
                fuzziness: 'AUTO',
              },
            }],
            ...(filter.length > 0 ? { filter } : {}),
          },
        },
        highlight: {
          fields: {
            title: { number_of_fragments: 0 },
            content: { fragment_size: 150, number_of_fragments: 3 },
          },
          pre_tags: ['<mark>'],
          post_tags: ['</mark>'],
        },
      }

      const response = await client.search({
        index: INDEX_NAME,
        body: searchBody,
      } as Parameters<typeof client.search>[0])

      const hits = response.body.hits
      const total = typeof hits.total === 'object' ? hits.total.value : hits.total
      return NextResponse.json({
        total,
        mode,
        hits: hits.hits.map((hit: Record<string, unknown>) => {
          const source = hit._source as HitSource
          const { content_embedding: _, ...sourceWithoutEmbedding } = source
          return {
            id: hit._id,
            score: hit._score,
            source: sourceWithoutEmbedding,
            highlight: hit.highlight ?? null,
          }
        }),
      })
    }

    // Semantic or Hybrid: fetch all docs with embeddings, compute similarity
    let queryEmbedding: number[]
    try {
      queryEmbedding = await generateQueryEmbedding(query)
    } catch (embeddingErr) {
      console.error(JSON.stringify({ error: 'Query embedding failed, falling back to keyword', details: embeddingErr instanceof Error ? embeddingErr.message : 'Unknown' }))
      // Fallback to keyword search
      const fallbackBody = {
        size: 10,
        query: {
          bool: {
            must: [{ multi_match: { query, fields: ['title^2', 'content'], fuzziness: 'AUTO' } }],
            ...(filter.length > 0 ? { filter } : {}),
          },
        },
        highlight: {
          fields: {
            title: { number_of_fragments: 0 },
            content: { fragment_size: 150, number_of_fragments: 3 },
          },
          pre_tags: ['<mark>'],
          post_tags: ['</mark>'],
        },
      }
      const fallbackResponse = await client.search({
        index: INDEX_NAME,
        body: fallbackBody,
      } as Parameters<typeof client.search>[0])
      const fallbackHits = fallbackResponse.body.hits
      const fallbackTotal = typeof fallbackHits.total === 'object' ? fallbackHits.total.value : fallbackHits.total
      return NextResponse.json({
        total: fallbackTotal,
        mode: 'keyword',
        fallback: true,
        hits: fallbackHits.hits.map((hit: Record<string, unknown>) => {
          const source = hit._source as HitSource
          const { content_embedding: _, ...sourceWithoutEmbedding } = source
          return {
            id: hit._id,
            score: hit._score,
            source: sourceWithoutEmbedding,
            highlight: hit.highlight ?? null,
          }
        }),
      })
    }

    const searchBody: Record<string, unknown> = {
      size: 100,
      _source: true,
      query: {
        bool: {
          must: [{ exists: { field: 'content_embedding' } }],
          ...(filter.length > 0 ? { filter } : {}),
        },
      },
    }

    if (mode === 'hybrid') {
      searchBody.query = {
        bool: {
          must: [{ match_all: {} }],
          ...(filter.length > 0 ? { filter } : {}),
        },
      }
      searchBody.highlight = {
        fields: {
          title: { number_of_fragments: 0 },
          content: { fragment_size: 150, number_of_fragments: 3 },
        },
        pre_tags: ['<mark>'],
        post_tags: ['</mark>'],
      }
    }

    const response = await client.search({
      index: INDEX_NAME,
      body: searchBody,
    } as Parameters<typeof client.search>[0])

    const rawHits = response.body.hits.hits as Record<string, unknown>[]

    const SEMANTIC_THRESHOLD = 0.3

    // Score each hit by cosine similarity
    const scored = rawHits
      .map((hit) => {
        const source = hit._source as HitSource
        const embedding = source.content_embedding
        const semanticScore = embedding ? dotProduct(queryEmbedding, embedding) : 0
        return { hit, source, semanticScore }
      })
      .filter(({ semanticScore }) => semanticScore >= SEMANTIC_THRESHOLD)

    if (mode === 'hybrid') {
      // Combine BM25 keyword score with semantic score
      const keywordBody = {
        size: 50,
        query: {
          bool: {
            must: [{
              multi_match: {
                query,
                fields: ['title^2', 'content'],
                fuzziness: 'AUTO',
              },
            }],
            ...(filter.length > 0 ? { filter } : {}),
          },
        },
        highlight: {
          fields: {
            title: { number_of_fragments: 0 },
            content: { fragment_size: 150, number_of_fragments: 3 },
          },
          pre_tags: ['<mark>'],
          post_tags: ['</mark>'],
        },
      }

      const keywordResponse = await client.search({
        index: INDEX_NAME,
        body: keywordBody,
      } as Parameters<typeof client.search>[0])

      const keywordHits = keywordResponse.body.hits.hits as Record<string, unknown>[]
      const keywordScores = new Map<string, { score: number; highlight: unknown }>()
      const maxKeywordScore = keywordHits.length > 0 ? (keywordHits[0]._score as number) : 1

      for (const kh of keywordHits) {
        keywordScores.set(kh._id as string, {
          score: (kh._score as number) / maxKeywordScore,
          highlight: kh.highlight ?? null,
        })
      }

      // Merge: all docs that appear in either semantic or keyword results
      const allIds = new Set<string>()
      const mergedResults: { id: string; score: number; source: Omit<HitSource, 'content_embedding'>; highlight: unknown }[] = []

      for (const { hit, source, semanticScore } of scored) {
        const id = hit._id as string
        allIds.add(id)
        const kw = keywordScores.get(id)
        const kwScore = kw?.score ?? 0
        const combinedScore = 0.6 * semanticScore + 0.4 * kwScore
        const { content_embedding: _, ...sourceClean } = source
        mergedResults.push({
          id,
          score: combinedScore,
          source: sourceClean,
          highlight: kw?.highlight ?? hit.highlight ?? null,
        })
      }

      // Add keyword-only results not in semantic set
      for (const kh of keywordHits) {
        const id = kh._id as string
        if (!allIds.has(id)) {
          const source = kh._source as HitSource
          const { content_embedding: _, ...sourceClean } = source
          const kwScore = (kh._score as number) / maxKeywordScore
          mergedResults.push({
            id,
            score: 0.4 * kwScore,
            source: sourceClean,
            highlight: kh.highlight ?? null,
          })
        }
      }

      mergedResults.sort((a, b) => b.score - a.score)
      const top = mergedResults.slice(0, 10)

      return NextResponse.json({
        total: mergedResults.length,
        mode,
        hits: top,
      })
    }

    // Pure semantic mode
    scored.sort((a, b) => b.semanticScore - a.semanticScore)
    const top = scored.slice(0, 10)

    return NextResponse.json({
      total: scored.length,
      mode,
      hits: top.map(({ hit, source, semanticScore }) => {
        const { content_embedding: _, ...sourceClean } = source
        return {
          id: hit._id as string,
          score: semanticScore,
          source: sourceClean,
          highlight: null,
        }
      }),
    })
  } catch (error: unknown) {
    const meta = (error as { meta?: { statusCode?: number } }).meta
    if (meta?.statusCode === 404) {
      return NextResponse.json({ total: 0, hits: [], mode })
    }
    return errorResponse('Search failed', error)
  }
}
