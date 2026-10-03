import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { FloatingInput, TakeOffButton, GoBackButton, MatrixLoader } from '../components/ui'

/** 忘记密码：发送重置邮件 */
export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    setError('')
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('请输入正确的邮箱')
      return
    }
    setSending(true)
    try {
      await resetPassword(email.trim())
      setDone(true)
      toast('重置邮件已发送', 'success')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-5 py-10">
      <div className="absolute left-4 top-4">
        <GoBackButton onClick={() => navigate('/login')} />
      </div>

      <div className="panel w-full max-w-sm p-7">
        <h1 className="text-2xl font-black">忘记密码</h1>
        <p className="mt-1 text-sm muted">输入注册邮箱，我们会发送重置链接</p>

        <div className="mt-8">
          <FloatingInput label="邮箱" type="email" value={email} onChange={setEmail} onEnter={submit} full />
        </div>

        {error && <p className="mt-3 text-sm font-semibold text-rose-500">{error}</p>}

        {sending && (
          <div className="mt-5 flex items-center gap-2 text-sm muted">
            <MatrixLoader /> 正在发送邮件…
          </div>
        )}

        {done ? (
          <div className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-600 dark:text-emerald-300">
            ✅ 重置链接已发送到 {email}，请在邮箱中查收（含垃圾邮件箱）。
          </div>
        ) : (
          <div className="mt-8 flex flex-col items-center gap-4">
            <TakeOffButton
              label="发送重置链接"
              sentLabel="已发送"
              disabled={sending}
              onAction={submit}
            />
          </div>
        )}

        <p className="mt-6 text-center text-sm muted">
          想起来了？
          <Link to="/login" className="ml-1 font-bold text-brand-500 hover:underline">
            返回登录
          </Link>
        </p>
      </div>
    </div>
  )
}
