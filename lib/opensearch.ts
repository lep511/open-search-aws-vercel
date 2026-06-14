import { Client } from '@opensearch-project/opensearch'
import { createOpenSearch } from '@vercel/aws'

let clientInstance: Client | null = null

export function getOpenSearchClient(): Client {
  if (!clientInstance) {
    clientInstance = createOpenSearch({
      endpoint: process.env.OPEN_SEARCH_OPENSEARCH_ENDPOINT,
      region: process.env.OPEN_SEARCH_AWS_REGION,
      roleArn: process.env.OPEN_SEARCH_AWS_ROLE_ARN,
    })
  }
  return clientInstance
}
