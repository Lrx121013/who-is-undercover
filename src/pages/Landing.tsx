import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { useToast } from '../hooks/useToast'
import { PencilLoader, DoodleButton, ThemeSwitch } from '../components/ui'

const FEATURES = [
  {
    icon: '🎭',
    title: '9 种角色',
    desc: '平民 / 卧底 / 白板 / 侦探 / 双面人…自由搭配',
  },
  {
    icon: '📚',
    title: '词库市场',
    desc: '系统词库 + 社区词库 + 自建词库一键导入',
  },
  {
    icon: '⚖️',
    title: '全自动主持',
    desc: '发词 · 计时 · 投票 · 判胜负，一步到位',
  },
  {
    icon: '🤝',
    title: '好友开黑',
    desc: '搜索加好友、邀请进房、默契度记录',
  },
  {
    icon: '🏆',
    title: '战绩成长',
    desc: '排行榜、成就徽章、等级段位',
  },
  {
    icon: '📝',
    title: '复盘回放',
    desc: '每轮发言顺序、投票、身份完整回放',
  },
]

export default function Landing() {
  const [booting, setBooting] = useState(true)
  const [showFeatures, setShowFeatures] = useState(false)
  const { theme, toggle } = useTheme()
  const { session, signInAsGuest } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    const t = window.setTimeout(() => {
      setBooting(false)
      setShowFeatures(true)
    }, 1800)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    if (session) navigate('/home', { replace: true })
  }, [session, navigate])

  const guestPlay = async () => {
    try {
      await signInAsGuest()
      toast('游客模式开启，稍后可在设置中绑定邮箱转正', 'success')
      navigate('/home')
    } catch (e) {
      toast((e as Error).message, 'error')
    }
  }

  if (booting) return <PencilLoader fullscreen text="谁是卧底出题器 加载中…" />

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 顶部导航 */}
      <div className="fixed top-0 z-50 w-full">
        <div className="glass-card mx-4 mt-4 flex items-center justify-between rounded-2xl px-5 py-3 md:mx-auto md:max-w-5xl">
          <span className="flex items-center gap-2 text-sm font-black tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-base shadow-lg shadow-indigo-500/25">
              🕵️
            </span>
            谁是卧底出题器
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="hidden rounded-xl px-4 py-2 text-xs font-bold text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white sm:block"
            >
              登录
            </button>
            <ThemeSwitch checked={theme === 'dark'} onChange={toggle} />
          </div>
        </div>
      </div>

      {/* Hero 区域 */}
      <div className="relative flex min-h-screen flex-col items-center justify-center px-5 pt-28 pb-16">
        {/* 背景装饰 */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute right-1/4 bottom-1/4 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
        </div>

        <div
          className="glass-card mb-6 flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold"
          style={{ animation: 'fadeUp .6s ease-out both' }}
        >
          <span className="h-2 w-2 rounded-full bg-emerald-400" style={{ animation: 'pulseSoft 2s ease-in-out infinite' }} />
          派对主持系统 v1.0
        </div>

        <h1
          className="text-center text-5xl leading-[1.1] tracking-tight md:text-7xl"
          style={{ animation: 'fadeUp .7s ease-out .1s both' }}
        >
          <span className="font-black">谁是卧底</span>
          <br />
          <span className="gradient-text font-black">出题器</span>
        </h1>

        <p
          className="mt-5 max-w-md text-center text-base leading-relaxed opacity-70 md:text-lg"
          style={{ animation: 'fadeUp .7s ease-out .2s both' }}
        >
          不只是出题器——集「主持人 + 裁判 + 记分员 + 气氛组」于一体的
          全流程派对主持系统
        </p>

        <div
          className="mt-10 flex flex-col items-center gap-4"
          style={{ animation: 'fadeUp .7s ease-out .35s both' }}
        >
          <div className="flex gap-3">
            <DoodleButton variant="C" onClick={() => navigate('/login')}>
              登 录
            </DoodleButton>
            <DoodleButton variant="A" onClick={() => navigate('/register')}>
              注 册
            </DoodleButton>
          </div>
          <button
            onClick={guestPlay}
            className="group flex items-center gap-1.5 text-sm font-bold opacity-60 transition hover:opacity-100"
          >
            游客试玩
            <span className="transition group-hover:translate-x-1">→</span>
          </button>
        </div>

        {/* 功能特性 */}
        {showFeatures && (
          <div
            className="mt-16 grid w-full max-w-3xl grid-cols-2 gap-3 md:grid-cols-3"
            style={{ animation: 'fadeUp .8s ease-out .5s both' }}
          >
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="glass-card rounded-2xl p-5 transition-transform duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${.55 + i * .08}s`, animation: `fadeUp .6s ease-out ${.55 + i * .08}s both` }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15 text-xl">
                  {f.icon}
                </div>
                <h3 className="mt-3 text-sm font-black tracking-tight">{f.title}</h3>
                <p className="mt-1 text-xs leading-relaxed opacity-50">{f.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* 底部 */}
        <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-2 text-center">
          <p className="text-xs opacity-40">
            React + Vite + Supabase · <Link to="/login" className="font-bold opacity-80 transition hover:opacity-100">开始游戏</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
