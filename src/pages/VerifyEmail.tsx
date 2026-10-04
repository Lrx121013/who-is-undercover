import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { verifyEmailToken } from '../lib/verifyEmail'
import { SpotlightLoader } from '../components/ui'

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [phase, setPhase] = useState<'loading' | 'ok' | 'bad'>('loading')

  useEffect(() => {
    const token = params.get('token')
    if (!token) {
      setPhase('bad')
      return
    }
    verifyEmailToken(token).then((r) => setPhase(r.ok ? 'ok' : 'bad'))
  }, [params])

  if (phase === 'loading')
    return <SpotlightLoader text="正在验证邮箱…" fullscreen />
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="display text-title">{phase === 'ok' ? '邮箱已验证' : '验证失败'}</h1>
      <p className="text-small muted">
        {phase === 'ok' ? '你的账号可以正常参与使用了。' : '该链接无效或已过期，请重新发送验证邮件。'}
      </p>
      <button
        className="rounded-card border border-[var(--rule-2)] px-4 py-2 text-body font-semibold"
        onClick={() => navigate(phase === 'ok' ? '/home' : '/login', { replace: true })}
      >
        {phase === 'ok' ? '进入游戏' : '返回登录'}
      </button>
    </div>
  )
}
