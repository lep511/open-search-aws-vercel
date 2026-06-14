import { createOpenSearch } from '@vercel/aws'
import type { Client } from '@opensearch-project/opensearch'

let client: Client | null = null

export default function getClient(): Client {
  if (!client) {
    client = createOpenSearch({
      endpoint: process.env.OPEN_SEARCH_AWS_OPENSEARCH_ENDPOINT,
      region: process.env.OPEN_SEARCH_AWS_AWS_REGION,
      roleArn: process.env.OPEN_SEARCH_AWS_AWS_ROLE_ARN,
    })
  }
  return client
}
