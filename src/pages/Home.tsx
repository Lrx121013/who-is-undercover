import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import {
  CardPair,
  Empty,
  Rule,
  SectionHead,
  Spinner,
  Stat,
} from '../components/primitives'
import {
  IconBook,
  IconDoor,
  IconFriends,
  IconMedal,
  IconPlus,
  IconRooms,
  IconSearch,
  IconSettings,
  IconTrophy,
  IconBell,
  IconEdit,
  IconUsers,
} from '../components/icons'
import { expToLevel, cn } from '../lib/utils'
import { listWordPairs } from '../lib/api'
import type { WordPair } from '../types/db'

const QUICK_LINKS = [
  { to: '/friends', icon: IconFriends, label: '好友' },
  { to: '/friends/search', icon: IconSearch, label: '找好友' },
  { to: '/word-packs', icon: IconBook, label: '词库市场' },
  { to: '/word-packs/mine', icon: IconEdit, label: '我的词库' },
  { to: '/leaderboard', icon: IconTrophy, label: '排行榜' },
  { to: '/achievements', icon: IconMedal, label: '成就' },
  { to: '/notifications', icon: IconBell, label: '通知' },
  { to: '/settings', icon: IconSettings, label: '设置' },
]

const STATS = [
  { key: 'games', label: '总场次' },
  { key: 'wins', label: '获胜' },
  { key: 'rate', label: '胜率' },
  { key: 'level', label: '等级' },
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
    listWordPairs(60)
      .then((rows) => {
        if (!alive) return
        if (rows.length) setPair(rows[Math.floor(Math.random() * rows.length)])
        setLoadingPair(false)
      })
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="space-y-10">
      {/* 迎客：一句问候 + 等级 */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-display tracking-tight">
            {profile?.nickname ?? '玩家'}，今晚开黑吗？
          </h1>
          <p className="mt-1.5 text-body muted">选择一种方式，快速开始你的派对</p>
        </div>
        <div className="text-right">
          <div className="tnum text-title font-bold" style={{ color: 'var(--accent)' }}>
            Lv.{level}
          </div>
          <div className="label mt-0.5">经验 {profile?.exp ?? 0}</div>
        </div>
      </header>

      {isGuest && (
        <div className="flex flex-wrap items-center gap-3 rounded-panel border border-[var(--rule-2)] bg-[var(--raised)] px-5 py-4">
          <p className="flex-1 text-small muted">
            当前为游客模式，战绩不会保留。前往设置绑定邮箱即可转正。
          </p>
          <button
            className="rounded-card border border-[var(--rule-2)] px-3 py-1.5 text-small font-semibold transition-colors hover:bg-[var(--raised-2)]"
            onClick={() => navigate('/settings')}
          >
            去绑定
          </button>
        </div>
      )}

      <Rule />

      {/* 战绩：四列数字，靠墨色浓淡分层 */}
      <section>
        <SectionHead sub="你的派对战绩一览">数据</SectionHead>
        <div className="grid grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-4">
          {STATS.map((s) => (
            <Stat
              key={s.key}
              value={statValue(s.key)}
              label={s.label}
              tone={s.key === 'level' ? 'accent' : 'ink'}
            />
          ))}
        </div>
      </section>

      <Rule />

      {/* 快速开始：三张入口 */}
      <section>
        <SectionHead sub="开房间、加入或逛逛大厅">快速开始</SectionHead>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { key: 'create', title: '创建房间', subtitle: '6 位房号 · 自定义角色与词库', icon: IconPlus, to: '/rooms/create' },
            { key: 'join', title: '加入房间', subtitle: '输入房间号 / 扫码进入', icon: IconDoor, to: '/rooms/join' },
            { key: 'list', title: '房间大厅', subtitle: '看看谁在等开局', icon: IconRooms, to: '/rooms' },
          ].map((c) => (
            <button
              key={c.key}
              onClick={() => navigate(c.to)}
              className="group flex flex-col items-start gap-3 rounded-panel border border-[var(--rule)] bg-[var(--raised)] p-5 text-left transition-colors hover:border-[var(--rule-2)] hover:bg-[var(--raised-2)]"
            >
              <c.icon size={22} className="text-[var(--accent)]" />
              <h3 className="text-body font-bold tracking-tight">{c.title}</h3>
              <p className="text-small muted">{c.subtitle}</p>
            </button>
          ))}
        </div>
      </section>

      <Rule />

      {/* 今日一对词 + 推荐词对 */}
      <section className="grid items-center gap-8 md:grid-cols-[auto_1fr]">
        <div>
          <SectionHead sub="今晚抽个词，先看看手气">今日词对</SectionHead>
          {loadingPair ? (
            <div className="flex items-center gap-3 text-small muted">
              <Spinner size={16} /> 正在加载词条…
            </div>
          ) : pair ? (
            <CardPair top={pair.civilian_word} bottom={pair.undercover_word} />
          ) : (
            <Empty
              title="还没有词条"
              hint="去词库市场逛逛，或者自己建一套。"
              action={
                <Link to="/word-packs" className="text-small font-semibold text-[var(--accent)]">
                  去逛逛词库
                </Link>
              }
            />
          )}
          {pair && (
            <p className="mt-4 text-micro faint">
              难度 {'★'.repeat(pair.difficulty)}{'☆'.repeat(Math.max(0, 5 - pair.difficulty))}
            </p>
          )}
        </div>

        <div>
          <SectionHead sub="其他常用去处">快捷入口</SectionHead>
          <div className="grid grid-cols-4 gap-x-4 gap-y-6 sm:grid-cols-8">
            {QUICK_LINKS.map((q) => (
              <Link
                key={q.to}
                to={q.to}
                className="group flex flex-col items-center gap-2 text-center"
              >
                <q.icon
                  size={22}
                  className="text-[var(--ink-3)] transition-colors group-hover:text-[var(--ink)]"
                />
                <span className="text-micro muted transition-colors group-hover:text-[var(--ink)]">
                  {q.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
