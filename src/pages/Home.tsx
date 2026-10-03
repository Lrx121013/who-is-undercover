import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { PageHeader } from '../components/Layout'
import { EmojiBar, MatrixLoader, DoodleButton } from '../components/ui'
import { expToLevel, cn } from '../lib/utils'
import { supabase } from '../lib/supabase'
import type { WordPair } from '../types/db'

const QUICK_LINKS = [
  { to: '/friends', icon: '🤝', label: '好友' },
  { to: '/friends/search', icon: '🔍', label: '找好友' },
  { to: '/word-packs', icon: '📚', label: '词库市场' },
  { to: '/word-packs/mine', icon: '✏️', label: '我的词库' },
  { to: '/leaderboard', icon: '🏆', label: '排行榜' },
  { to: '/achievements', icon: '🎖️', label: '成就' },
  { to: '/notifications', icon: '🔔', label: '通知' },
  { to: '/settings', icon: '⚙️', label: '设置' },
]

const STATS = [
  { key: 'games', label: '总场次', icon: '🎮' },
  { key: 'wins', label: '获胜', icon: '🏆' },
  { key: 'rate', label: '胜率', icon: '📊' },
  { key: 'level', label: '等级', icon: '⭐' },
] as const

export default function Home() {
  const { profile, isGuest } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [pair, setPair] = useState<WordPair | null>(null)
  const [loadingPair, setLoadingPair] = useState(true)

  const level = profile ? expToLevel(profile.exp) : 1
  const winRate =
    profile && profile.total_games > 0
      ? Math.round((profile.win_count / profile.total_games) * 100)
      : 0

  const statValue = (key: (typeof STATS)[number]['key']): string => {
    switch (key) {
      case 'games':
        return String(profile?.total_games ?? 0)
      case 'wins':
        return String(profile?.win_count ?? 0)
      case 'rate':
        return `${winRate}%`
      case 'level':
        return `Lv.${level}`
    }
  }

  useEffect(() => {
    let alive = true
    supabase
      .from('word_pairs')
      .select('*')
      .limit(60)
      .then(({ data }) => {
        if (!alive) return
        const rows = (data as WordPair[]) ?? []
        if (rows.length) setPair(rows[Math.floor(Math.random() * rows.length)])
        setLoadingPair(false)
      })
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* 欢迎区 */}
      <div
        className="glass-card relative overflow-hidden p-6 md:p-8"
        style={{ animation: 'fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both' }}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative flex flex-wrap items-center gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-black tracking-tight md:text-3xl">
              {profile?.nickname ?? '玩家'}，今晚开黑吗？
            </h1>
            <p className="mt-1 text-sm opacity-50">选择一种方式，快速开始你的派对</p>
          </div>
          <span className="chip flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-[10px] text-white shadow-md">
              Lv
            </span>
            {level} · 经验 {profile?.exp ?? 0}
          </span>
        </div>

        {isGuest && (
          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-amber-300/30 bg-amber-400/10 p-4 text-sm">
            <span>🎫</span>
            <p className="flex-1 text-amber-700 dark:text-amber-300">
              当前为游客模式，战绩不会保留。前往设置绑定邮箱即可转正。
            </p>
            <DoodleButton variant="A" size="sm" onClick={() => navigate('/settings')}>
              去绑定
            </DoodleButton>
          </div>
        )}
      </div>

      {/* 数据卡片 */}
      <div
        className="grid grid-cols-2 gap-3 md:grid-cols-4"
        style={{ animation: 'fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) .1s both' }}
      >
        {STATS.map((s, i) => (
          <div
            key={s.key}
            className={cn(
              'glass-card p-5 text-center transition-transform duration-300 hover:-translate-y-1',
              `stagger-${i + 1}`,
            )}
          >
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/12 to-violet-500/12 text-base mx-auto">
              {s.icon}
            </div>
            <p className="text-2xl font-black tracking-tight text-indigo-500 dark:text-indigo-300">
              {statValue(s.key)}
            </p>
            <p className="mt-1 text-xs font-semibold opacity-40">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 快速开始 */}
      <section
        className="glass-card p-5 md:p-6"
        style={{ animation: 'fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) .2s both' }}
      >
        <h2 className="mb-4 flex items-center gap-2 text-base font-black tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/15 to-violet-500/15 text-sm">
            🚀
          </span>
          快速开始
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              key: 'create',
              title: '创建房间',
              subtitle: '6 位房号 · 自定义角色与词库',
              icon: '➕',
              to: '/rooms/create',
            },
            {
              key: 'join',
              title: '加入房间',
              subtitle: '输入房间号 / 扫码进入',
              icon: '🚪',
              to: '/rooms/join',
            },
            {
              key: 'list',
              title: '房间大厅',
              subtitle: '看看谁在等开局',
              icon: '🎮',
              to: '/rooms',
            },
          ].map((c, i) => (
            <button
              key={c.key}
              onClick={() => navigate(c.to)}
              className={cn(
                'group flex flex-col items-start gap-2 rounded-2xl border border-black/6 bg-white/40 p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-500/30 hover:bg-indigo-500/5 dark:border-white/10 dark:bg-white/5 dark:hover:bg-indigo-500/10',
                `stagger-${i + 1}`,
              )}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/12 to-violet-500/12 text-xl transition-transform group-hover:scale-110">
                {c.icon}
              </span>
              <h3 className="text-sm font-black tracking-tight">{c.title}</h3>
              <p className="text-xs leading-relaxed opacity-40">{c.subtitle}</p>
            </button>
          ))}
        </div>
      </section>

      {/* 今日心情 + 推荐词对 */}
      <div
        className="grid gap-4 md:grid-cols-2"
        style={{ animation: 'fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) .3s both' }}
      >
        <section className="glass-card p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-black tracking-tight">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/15 to-violet-500/15 text-xs">
              😊
            </span>
            今天心情
          </h2>
          <p className="mb-4 text-xs opacity-40">点个表情，记录今晚的状态</p>
          <EmojiBar onSelect={(e) => toast(`心情 ${e} 已记录`, 'success')} />
        </section>

        <section className="glass-card p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-black tracking-tight">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/15 to-violet-500/15 text-xs">
              🎲
            </span>
            今日推荐词对
          </h2>
          {loadingPair ? (
            <div className="flex items-center gap-3 py-4 text-sm opacity-50">
              <MatrixLoader /> 正在加载词条…
            </div>
          ) : pair ? (
            <div className="flex items-center justify-center gap-4 py-3">
              <span className="rounded-xl bg-indigo-500/15 px-4 py-2.5 text-lg font-black text-indigo-500 dark:text-indigo-300">
                {pair.civilian_word}
              </span>
              <span className="text-lg font-black opacity-30">🆚</span>
              <span className="rounded-xl bg-rose-500/15 px-4 py-2.5 text-lg font-black text-rose-500 dark:text-rose-300">
                {pair.undercover_word}
              </span>
              <span className="text-xs opacity-30">{'★'.repeat(pair.difficulty)}</span>
            </div>
          ) : (
            <p className="py-4 text-sm opacity-40">暂无词条，去词库市场逛逛</p>
          )}
        </section>
      </div>

      {/* 快捷入口 */}
      <section
        className="glass-card p-5"
        style={{ animation: 'fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) .4s both' }}
      >
        <h2 className="mb-4 flex items-center gap-2 text-sm font-black tracking-tight">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/15 to-violet-500/15 text-xs">
            🧭
          </span>
          快捷入口
        </h2>
        <div className="grid grid-cols-4 gap-3">
          {QUICK_LINKS.map((q, i) => (
            <Link
              key={q.to}
              to={q.to}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl border border-black/4 bg-black/[0.015] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-500/25 hover:bg-indigo-500/5 dark:border-white/8 dark:bg-white/3 dark:hover:bg-indigo-500/10',
                `stagger-${(i % 4) + 1}`,
              )}
            >
              <span className="text-2xl">{q.icon}</span>
              <span className="text-xs font-bold opacity-70">{q.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
