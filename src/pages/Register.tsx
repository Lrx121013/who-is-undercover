import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { createVerificationEmail } from '../lib/verifyEmail'
import { DoodleButton, GoBackButton } from '../components/ui'

export default function Register() {
  const { signUp } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [invite, setInvite] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false)

  const submit = async () => {
    setError('')
    setNeedsEmailConfirm(false)
    if (nickname.trim().length < 2) return setError('昵称至少 2 个字符')
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('邮箱格式不正确')
    if (password.length < 6) return setError('密码至少 6 位')
    if (password !== confirm) return setError('两次输入的密码不一致')
    setLoading(true)
    try {
      const { uid } = await signUp(email.trim(), password, nickname.trim())
      if (uid) await createVerificationEmail(uid, email.trim(), nickname.trim())
      setNeedsEmailConfirm(true)
      toast('注册成功！请前往邮箱点击验证链接以激活账号', 'success')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const inputCls =
    'w-full rounded-xl border border-black/8 bg-white/50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 dark:border-white/10 dark:bg-white/5'
  const labelCls = 'mb-1.5 block text-xs font-bold tracking-wide opacity-60'

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 背景装饰 */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <div className="fixed left-4 top-4 z-20">
        <GoBackButton onClick={() => navigate('/login')} />
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
            <h1 className="mt-4 text-2xl font-black tracking-tight">注册</h1>
            <p className="mt-1 text-sm opacity-60">创建你的派对身份</p>
          </div>

          {/* 表单 */}
          <div className="space-y-5">
            <div>
              <label className={labelCls}>昵称</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                placeholder="派对中的名字"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                邀请码 <span className="ml-1 font-normal opacity-40">（选填）</span>
              </label>
              <input
                type="text"
                value={invite}
                onChange={(e) => setInvite(e.target.value.toUpperCase())}
                maxLength={8}
                placeholder="8 位邀请码"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="至少 6 位"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>确认密码</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                autoComplete="new-password"
                placeholder="再次输入密码"
                className={inputCls}
              />
            </div>

            <p className="text-xs leading-relaxed opacity-40">
              注册成功后系统会向你的邮箱发送验证邮件，点击邮件中的链接即可激活账号。
            </p>

            {error && (
              <div className="rounded-lg border border-rose-300/30 bg-rose-500/8 px-3 py-2.5 text-xs font-semibold text-rose-500 dark:text-rose-300">
                {error}
              </div>
            )}

            {needsEmailConfirm && !error && (
              <div className="rounded-lg border border-emerald-300/30 bg-emerald-400/10 px-3 py-2.5 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                ✅ 验证邮件已发送至 <strong>{email}</strong>，请前往邮箱点击确认链接完成注册。
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="mt-7 flex flex-col items-center gap-4">
            <DoodleButton variant="A" onClick={submit} loading={loading} size="full">
              注 册
            </DoodleButton>

            <div className="flex w-full items-center gap-3 text-xs opacity-40">
              <span className="h-px flex-1 bg-black/10 dark:bg-white/10" />
              已给过邮箱了？
              <span className="h-px flex-1 bg-black/10 dark:bg-white/10" />
            </div>

            <p className="text-sm opacity-60">
              已有账号？
              <Link to="/login" className="ml-1 font-bold text-indigo-500 transition hover:opacity-80">
                直接登录
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
