import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import MicrosoftButton from '../components/MicrosoftButton'
import { DoodleButton, GoBackButton } from '../components/ui'

export default function Login() {
  const { signIn, signInAsGuest, signInWithMicrosoft, emailNeedsConfirmation, resendConfirmEmail } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msLoading, setMsLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    setError('')
    if (!email.trim() || !password) {
      setError('请输入邮箱和密码')
      return
    }
    setLoading(true)
    try {
      await signIn(email.trim(), password)
      toast('登录成功，欢迎回来！', 'success')
      navigate('/home')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const microsoft = async () => {
    setError('')
    setMsLoading(true)
    try {
      await signInWithMicrosoft()
    } catch (e) {
      setError((e as Error).message)
      setMsLoading(false)
    }
  }

  const guest = async () => {
    try {
      await signInAsGuest()
      toast('游客模式开启', 'success')
      navigate('/home')
    } catch (e) {
      toast((e as Error).message, 'error')
    }
  }

  const resendTime = async () => {
    try {
      await resendConfirmEmail(email.trim())
      toast('验证邮件已重新发送，请检查邮箱', 'success')
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 背景装饰 */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      {/* 返回 */}
      <div className="fixed left-4 top-4 z-20">
        <GoBackButton onClick={() => navigate('/')} />
      </div>

      {/* 顶部导航 */}
      <div className="fixed right-4 top-4 z-20">
        <Link to="/" className="hidden text-xs font-bold opacity-40 transition hover:opacity-70 sm:block">
          首页
        </Link>
      </div>

      <div className="flex min-h-screen items-center justify-center px-5 py-10">
        <div
          className="glass-card w-full max-w-sm p-8"
          style={{ animation: 'scaleIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both' }}
        >
          {/* Logo */}
          <div className="mb-8 text-center">
            <span className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-2xl shadow-lg shadow-indigo-500/25">
              🕵️
            </span>
            <h1 className="mt-4 text-2xl font-black tracking-tight">登录</h1>
            <p className="mt-1 text-sm opacity-60">欢迎回到派对现场</p>
          </div>

          {/* 表单 */}
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-bold tracking-wide opacity-60">
                邮箱
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-black/8 bg-white/50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 dark:border-white/10 dark:bg-white/5"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold tracking-wide opacity-60">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                autoComplete="current-password"
                placeholder="••••••"
                className="w-full rounded-xl border border-black/8 bg-white/50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 dark:border-white/10 dark:bg-white/5"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-rose-300/30 bg-rose-500/8 px-3 py-2.5 text-xs font-semibold text-rose-500 dark:text-rose-300">
                {error}
              </div>
            )}

            {emailNeedsConfirmation && !error && (
              <div className="rounded-lg border border-amber-300/40 bg-amber-400/10 px-3 py-2.5 text-xs font-semibold text-amber-600 dark:text-amber-300">
                ⚠️ 邮箱尚未验证，请去邮箱点击确认链接
                <button
                  onClick={resendTime}
                  className="ml-1.5 underline underline-offset-2 hover:opacity-70"
                >
                  重新发送
                </button>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="mt-7 flex flex-col items-center gap-4">
            <DoodleButton variant="C" onClick={submit} loading={loading} size="full">
              登 录
            </DoodleButton>

            <div className="flex w-full items-center gap-3 text-xs opacity-40">
              <span className="h-px flex-1 bg-black/10 dark:bg-white/10" />
              或
              <span className="h-px flex-1 bg-black/10 dark:bg-white/10" />
            </div>

            <MicrosoftButton onClick={microsoft} loading={msLoading} />

            <div className="flex w-full items-center justify-between text-sm">
              <Link to="/register" className="font-bold text-indigo-500 transition hover:opacity-80">
                注册新账号
              </Link>
              <Link to="/forgot-password" className="opacity-50 transition hover:opacity-80">
                忘记密码？
              </Link>
            </div>

            <button
              onClick={guest}
              className="text-sm font-bold opacity-50 transition hover:opacity-90"
            >
              游客试玩 →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
