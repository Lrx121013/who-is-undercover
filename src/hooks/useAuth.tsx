import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, siteUrl } from '../lib/supabase'
import type { Profile } from '../types/db'
import { randomCode } from '../lib/utils'

interface AuthCtx {
  session: Session | null
  profile: Profile | null
  loading: boolean
  isGuest: boolean
  /** 注册后是否处于「邮箱未验证」状态，UI 可用于提示用户 */
  emailNeedsConfirmation: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, nickname: string) => Promise<void>
  signInWithMicrosoft: () => Promise<void>
  signInAsGuest: () => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  refreshProfile: () => Promise<void>
  resendConfirmEmail: (email: string) => Promise<void>
}

const Ctx = createContext<AuthCtx>({} as AuthCtx)

export function useAuth() {
  return useContext(Ctx)
}

/** 从 OAuth（Microsoft）用户信息中提取昵称候选 */
function oauthNickname(u: User): string | undefined {
  const m = u.user_metadata ?? {}
  return (
    (m.nickname as string) ||
    (m.full_name as string) ||
    (m.name as string) ||
    (m.preferred_username as string) ||
    (u.email ? u.email.split('@')[0] : undefined)
  )
}

/** 从 OAuth 用户信息中提取头像地址（Microsoft 可能返回 picture） */
function oauthAvatar(u: User): string | undefined {
  const m = u.user_metadata ?? {}
  return (m.avatar_url as string) || (m.picture as string) || undefined
}

async function ensureProfile(
  userId: string,
  meta?: { nickname?: string; avatarUrl?: string },
): Promise<Profile> {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (data) {
    const p = data as Profile
    if (!p.avatar_url && meta?.avatarUrl) {
      const patch = { avatar_url: meta.avatarUrl }
      await supabase.from('profiles').update(patch).eq('id', userId)
      return { ...p, ...patch }
    }
    return p
  }
  const fallback = meta?.nickname?.trim() || `玩家${randomCode(4)}`
  const { data: inserted } = await supabase
    .from('profiles')
    .insert({ id: userId, nickname: fallback, avatar_url: meta?.avatarUrl ?? null })
    .select()
    .single()
  return inserted as Profile
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [emailNeedsConfirmation, setEmailNeedsConfirmation] = useState(false)

  const loadProfile = useCallback(async (user: User) => {
    const p = await ensureProfile(user.id, {
      nickname: oauthNickname(user),
      avatarUrl: oauthAvatar(user),
    })
    setProfile(p ?? null)
  }, [])

  useEffect(() => {
    let alive = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!alive) return
      setSession(data.session)
      if (data.session?.user) await loadProfile(data.session.user)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (s?.user) void loadProfile(s.user)
      else {
        setProfile(null)
        setEmailNeedsConfirmation(false)
      }
    })
    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [loadProfile])

  const value = useMemo<AuthCtx>(
    () => ({
      session,
      profile,
      loading,
      isGuest: Boolean(session?.user?.is_anonymous),
      emailNeedsConfirmation,
      signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw new Error(translateAuthError(error.message))
        if (!data.session?.user?.email_confirmed_at) {
          setEmailNeedsConfirmation(true)
        } else {
          setEmailNeedsConfirmation(false)
        }
      },
      signUp: async (email, password, nickname) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { nickname },
            // 邮箱验证链接将指向 siteUrl 下的 /auth/callback
            emailRedirectTo: `${siteUrl}/auth/callback`,
          },
        })
        if (error) throw new Error(translateAuthError(error.message))
        if (data.user && !data.session) {
          setEmailNeedsConfirmation(true)
        } else {
          setEmailNeedsConfirmation(false)
          const uid = data.user?.id
          if (uid) await ensureProfile(uid, { nickname })
        }
      },
      resendConfirmEmail: async (email) => {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email,
          options: {
            emailRedirectTo: `${siteUrl}/auth/callback`,
          },
        })
        if (error) throw new Error(translateAuthError(error.message))
      },
      signInWithMicrosoft: async () => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'azure',
          options: {
            scopes: 'email openid profile',
            // 使用构建时注入的 siteUrl，确保重定向到部署域名而非 localhost
            redirectTo: `${siteUrl}/auth/callback`,
          },
        })
        if (error) throw new Error(translateOAuthError(error.message))
      },
      signInAsGuest: async () => {
        const { error } = await supabase.auth.signInAnonymously()
        if (error) throw new Error(translateAuthError(error.message))
      },
      signOut: async () => {
        await supabase.auth.signOut()
      },
      resetPassword: async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          // 重置密码邮件链接也指向 siteUrl
          redirectTo: `${siteUrl}/reset-password`,
        })
        if (error) throw new Error(translateAuthError(error.message))
      },
      updatePassword: async (password) => {
        const { error } = await supabase.auth.updateUser({ password })
        if (error) throw new Error(translateAuthError(error.message))
      },
      refreshProfile: async () => {
        if (session?.user) await loadProfile(session.user)
      },
    }),
    [session, profile, loading, emailNeedsConfirmation, loadProfile],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function translateAuthError(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return '邮箱或密码不正确'
  if (/email not confirmed/i.test(msg)) return '邮箱尚未验证，请先去邮箱确认'
  if (/already registered|already been registered/i.test(msg)) return '该邮箱已注册，请直接登录'
  if (/anonymous/i.test(msg)) return '游客登录暂不可用'
  if (/password/i.test(msg) && /short|weak/i.test(msg)) return '密码强度不足，至少 6 位'
  if (/rate/i.test(msg)) return '操作太频繁，请稍后再试'
  return msg
}

export function translateOAuthError(msg: string): string {
  if (/provider is not enabled|unsupported provider|not enabled/i.test(msg))
    return 'Microsoft 登录未启用：请先在 Supabase 后台开启 Azure 提供商'
  if (/redirect|url is not allowed|invalid.*url/i.test(msg))
    return '回调地址未授权：请把本站地址加入 Supabase 的 Redirect URLs'
  if (/popup|closed/i.test(msg)) return '登录窗口已关闭，请重试'
  return msg
}
