import { gql } from './db'

/**
 * 自建邮箱验证（不依赖 Nhost 发信）：
 *   1. signUp 后用返回的 uid 在 email_verifications 插一条 { uid, email, token, expires_at }
 *   2. POST /api/send-verification 把含 token 的链接发到用户邮箱（Mailtrap）
 *   3. VerifyEmail 页面校验 token、标记 used_at 并置 profiles.email_verified = true
 */

const TTL_MS = 24 * 60 * 60 * 1000

export async function createVerificationEmail(uid: string, email: string, nickname: string): Promise<string> {
  const token = crypto.randomUUID().replace(/-/g, '')
  const expires = new Date(Date.now() + TTL_MS).toISOString()
  const { error } = await gql(
    `mutation($uid: uuid!, $email: String!, $token: String!, $expires: timestamptz!) { insert_email_verifications_one(object: {user_id: $uid, email: $email, token: $token, expires_at: $expires}) { id } }`,
    { uid, email, token, expires },
  )
  if (error) throw new Error(error.message)

  const link = `${window.location.origin}/verify-email?token=${token}`
  try {
    await fetch('/api/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, nickname, link }),
    })
  } catch {
    // 开发环境没起 api 路由时不阻断注册
  }
  return token
}

export async function verifyEmailToken(token: string): Promise<{ ok: boolean; userId?: string }> {
  const { data } = await gql<{ email_verifications: any[] }>(
    `query($t: String!) { email_verifications(where: {token: {_eq: $t}}, limit: 1) { id user_id email token used_at expires_at } }`,
    { t: token },
  )
  const row = data?.email_verifications?.[0]
  if (!row) return { ok: false }
  if (row.used_at) return { ok: false, userId: row.user_id }
  if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false, userId: row.user_id }

  await gql(`mutation($id: uuid!) { update_email_verifications_by_pk(pk_columns: {id: $id}, _set: {used_at: now()}) { id } }`, { id: row.id })
  if (row.user_id) {
    await gql(`mutation($u: uuid!) { update_profiles_by_pk(pk_columns: {id: $u}, _set: {email_verified: true}) { id } }`, { u: row.user_id })
  }
  return { ok: true, userId: row.user_id }
}
