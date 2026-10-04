import { NhostClient } from '@nhost/nhost-js'

/**
 * Nhost 客户端（Hasura GraphQL + Nhost Auth）
 *
 * 注意：Nhost 与 Supabase 不是同一套 API。
 * 这里的 Client 正在逐步替换 src/lib/api.ts 里的 supabase-js 调用。
 */
export const nhost = new NhostClient({
  subdomain: import.meta.env.VITE_NHOST_SUBDOMAIN ?? 'wdcepbrekhxwnzcoereg',
  region: import.meta.env.VITE_NHOST_REGION ?? 'ap-southeast-1',
})
