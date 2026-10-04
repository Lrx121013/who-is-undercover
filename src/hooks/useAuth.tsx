import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { nhost } from '../lib/nhost'
import { gql } from '../lib/db'
import type { Profile } from '../types/db'

/** 最小会话视图（够 Layout / ProtectedRoute 判断登录态即可） */
export interface AuthSession {
  accessToken: string
  user: { id: string; email?: string; is_anonymous?: boolean; metadata?: Record<string, unknown> }
}

interface AuthCtx {
  session: AuthSession | null
  profile: Profile | null
  loading: boolean
  isGuest: boolean
  emailNeedsConfirmation: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, nickname: string) => Promise<{ uid: string | null }>
  sendMagicLink: (email: string) => Promise<void>
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

async function getProfile(uid: string): Promise<Profile | null> {
  const { data } = await gql<{ profiles: Profile[] }>(
    `query($id: uuid!) { profiles(where: {id: {_eq: $id}}, limit: 1) { id nickname avatar_url bio gender birthday level exp total_games win_count short_id show_online created_at } }`,
    { id: uid },
  )
  return data?.profiles?.[0] ?? null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [emailNeedsConfirmation, setEmailNeedsConfirmation] = useState(false)

  const loadProfile = useCallback(async (uid: string) => {
    const p = await getProfile(uid)
    setProfile(p)
  }, [])

  useEffect(() => {
    let alive = true
    const sync = async () => {
      const s = nhost.auth.getSession() as any
      if (!alive) return
      const sess: AuthSession | null = s?.accessToken
        ? { accessToken: s.accessToken, user: s.user ?? { id: (s as any).user?.id } }
        : null
      setSession(sess)
      if (sess?.user?.id) await loadProfile(sess.user.id)
      if (alive) setLoading(false)
    }
    void sync()
    const unsubscribe = nhost.auth.onAuthStateChanged(async (_e, s) => {
      const sess: AuthSession | null = s && (s as any).accessToken
        ? { accessToken: (s as any).accessToken, user: (s as any).user }
        : null
      setSession(sess)
      if (sess?.user?.id) {
        await loadProfile(sess.user.id)
      } else {
        setProfile(null)
        setEmailNeedsConfirmation(false)
      }
    })
    return () => {
      alive = false
      try {
        ;(unsubscribe as any)?.()
      } catch {
        /* noop */
      }
    }
  }, [loadProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    const { session: s, error } = await nhost.auth.signIn({ email, password }) as any
    if (error) throw new Error(translateAuthError(error.message))
    setEmailNeedsConfirmation(false)
  }, [])

  const signUp = useCallback(
    async (email: string, password: string, nickname: string) => {
      const { session: s, error } = await nhost.auth.signUp({
        email,
        password,
        options: { metadata: { nickname } },
      } as any) as any
      if (error) throw new Error(translateAuthError(error.message))
      const uid = ((s as any)?.user?.id as string | undefined) ?? null
      if (!s) {
        // 无会话=需要邮件验证；Nhost 仍会返回 user，用于我们自建验证邮件
        setEmailNeedsConfirmation(true)
        return { uid }
      }
      setEmailNeedsConfirmation(false)
      if (uid) {
        await gql(
          `mutation($id: uuid!, $n: String!) { insert_profiles_one(object: {id: $id, nickname: $n}) { id } }`,
          { id: uid, n: nickname },
        )
        await loadProfile(uid)
      }
      return { uid }
    },
    [loadProfile],
  )

  const sendMagicLink = useCallback(async (email: string) => {
    const { error } = await nhost.auth.signIn({ email } as any) as any
    if (error) throw new Error(translateAuthError(error.message))
  }, [])

  const signInAsGuest = useCallback(async () => {
    const { error } = await nhost.auth.signIn() as any
    if (error) throw new Error(translateAuthError(error.message))
  }, [])

  const signOut = useCallback(async () => {
    await nhost.auth.signOut()
    setSession(null)
    setProfile(null)
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await nhost.auth.resetPassword({ email } as any) as any
    if (error) throw new Error(translateAuthError(error.message))
  }, [])

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await nhost.auth.changePassword({ newPassword: password } as any) as any
    if (error) throw new Error(translateAuthError(error.message))
  }, [])

  const refreshProfile = useCallback(async () => {
    const uid = nhost.auth.getUser()?.id
    if (uid) await loadProfile(uid)
  }, [loadProfile])

  const resendConfirmEmail = useCallback(async (email: string) => {
    const { error } = await nhost.auth.sendVerificationEmail({ email } as any) as any
    if (error) throw new Error(translateAuthError(error.message))
  }, [])

  const value = useMemo<AuthCtx>(
    () => ({
      session,
      profile,
      loading,
      isGuest: Boolean((session?.user as any)?.is_anonymous),
      emailNeedsConfirmation,
      signIn,
      signUp,
      sendMagicLink,
      signInAsGuest,
      signOut,
      resetPassword,
      updatePassword,
      refreshProfile,
      resendConfirmEmail,
    }),
    [session, profile, loading, emailNeedsConfirmation, signIn, signUp, sendMagicLink, signInAsGuest, signOut, resetPassword, updatePassword, refreshProfile, resendConfirmEmail],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function translateAuthError(msg: string): string {
  if (/invalid login credentials|unauthorized|invalid email or password/i.test(msg))
    return '邮箱或密码不正确'
  if (/email.*confirm|confirm.*email|not verified/i.test(msg)) return '邮箱尚未验证，请先去邮箱确认'
  if (/already.*registered|already.*use|exists/i.test(msg)) return '该邮箱已注册，请直接登录'
  if (/anonymous/i.test(msg)) return '游客登录暂不可用'
  if (/password/i.test(msg) && /short|weak|min/i.test(msg)) return '密码强度不足，至少 6 位'
  if (/rate/i.test(msg)) return '操作太频繁，请稍后再试'
  return msg
}

export function translateOAuthError(msg: string): string {
  if (/provider.*not enabled|unsupported provider|not enabled|admin|redirect/i.test(msg))
    return '第三方登录未启用或回调未授权：请在 Nhost 后台配置 Azure 提供商和回调 URL'
  if (/popup|closed/i.test(msg)) return '登录窗口已关闭，请重试'
  return msg
}
