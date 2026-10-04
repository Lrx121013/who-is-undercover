import { nhost } from './nhost'

/** 统一的 GraphQL 出口（api.ts 内按函数逐个用 `gql` 重写） */
export interface GqlResult<T> {
  data: T | null
  error: { message: string } | null
}

/** 发一次 GraphQL 请求，返回类 Supabase 的 { data, error } */
export async function gql<T = any>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<GqlResult<T>> {
  const res: any = await (nhost.graphql as any).request(query, variables)
  return { data: res?.data ?? null, error: res?.error ?? null }
}

/** 当前登录用户 id */
export async function currentUserId(): Promise<string | null> {
  return nhost.auth.getUser()?.id ?? null
}

/** 当前登录用户 */
export function currentUser() {
  return nhost.auth.getUser()
}
