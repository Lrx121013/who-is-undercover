import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { FloatingInput, DoodleButton, GoBackButton, SpotlightLoader } from '../components/ui'

/** 重置密码：从邮件恢复链接进入（Nhost 自动携带 token） */
export default function ResetPassword() {
  const { updatePassword } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    setError('')
    if (password.length < 6) return setError('密码至少 6 位')
    if (password !== confirm) return setError('两次输入的密码不一致')
    setLoading(true)
    try {
      await updatePassword(password)
      toast('密码已更新，请使用新密码登录', 'success')
      navigate('/login')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-5 py-10">
      <div className="absolute left-4 top-4">
        <GoBackButton onClick={() => navigate('/login')} />
      </div>

      {loading && <SpotlightLoader text="更新中…" fullscreen scale={1.6} />}

      <div className="panel w-full max-w-sm p-7">
        <h1 className="text-2xl font-black">重置密码</h1>
        <p className="mt-1 text-sm muted">设置一个新密码</p>

        <div className="mt-8 space-y-8">
          <FloatingInput
            label="新密码"
            type="password"
            value={password}
            onChange={setPassword}
            full
            autoComplete="new-password"
          />
          <FloatingInput
            label="确认新密码"
            type="password"
            value={confirm}
            onChange={setConfirm}
            full
            onEnter={submit}
            autoComplete="new-password"
          />
        </div>

        {error && <p className="mt-3 text-sm font-semibold text-rose-500">{error}</p>}

        <div className="mt-8 flex justify-center">
          <DoodleButton variant="B" onClick={submit} loading={loading} size="full">
            确认修改
          </DoodleButton>
        </div>
      </div>
    </div>
  )
}
