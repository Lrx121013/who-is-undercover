import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useToast } from '../hooks/useToast'
import { SpotlightLoader } from '../components/ui'

/** OAuth（Microsoft）回调：SDK 依据 URL 中的 code / hash 自动换取会话后跳转首页 */
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

    const go = () => {
      if (alive) navigate('/home', { replace: true })
    }

    // 已存在会话（隐式流程或二次进入）
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) go()
    })
    // PKCE 换码完成后会触发 SIGNED_IN
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) go()
    })

    const timer = window.setTimeout(() => {
      if (alive) setText('登录超时，正在返回…')
    }, 8000)
    const fallback = window.setTimeout(() => {
      if (alive) navigate('/login', { replace: true })
    }, 10000)

    return () => {
      alive = false
      sub.subscription.unsubscribe()
      window.clearTimeout(timer)
      window.clearTimeout(fallback)
    }
  }, [navigate, toast])

  return <SpotlightLoader text={text} fullscreen scale={1.6} />
}