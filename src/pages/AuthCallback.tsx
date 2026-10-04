import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { nhost } from '../lib/nhost'
import { useToast } from '../hooks/useToast'
import { SpotlightLoader } from '../components/ui'

/** OAuth / 魔法链接回调：Nhost 会从 URL 解析 token 自动建会话后跳转首页 */
export default function AuthCallback() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [text, setText] = useState('正在完成登录…')

  useEffect(() => {
    let alive = true
    const params = new URLSearchParams(window.location.search)
    const errDesc = params.get('error_description') || params.get('error')
    if (errDesc) {
      toast(decodeURIComponent(errDesc.replace(/\+/g, ' ')), 'error')
      navigate('/login', { replace: true })
      return
    }

    if (nhost.auth.isAuthenticated()) {
      navigate('/home', { replace: true })
      return
    }
    const unsub = nhost.auth.onAuthStateChanged((_e, s) => {
      if (s) navigate('/home', { replace: true })
    })
    const timer = window.setTimeout(() => alive && setText('登录超时，正在返回…'), 8000)
    const fallback = window.setTimeout(() => alive && navigate('/login', { replace: true }), 10000)

    return () => {
      alive = false
      try {
        ;(unsub as any)?.()
      } catch {
        /* noop */
      }
      window.clearTimeout(timer)
      window.clearTimeout(fallback)
    }
  }, [navigate, toast])

  return <SpotlightLoader text={text} fullscreen scale={1.6} />
}
