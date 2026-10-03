import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/Layout'
import { Cards, LuxuryCard } from '../components/ui'
import { leaderboard } from '../lib/api'
import { cn, avatarDataUri, expToLevel } from '../lib/utils'
import type { Profile } from '../types/db'

const ORDERS = [
  { k: 'win_count', label: '最强王者（胜场）' },
  { k: 'level', label: '最高等级' },
  { k: 'total_games', label: '最肝玩家（场次）' },
] as const

const MEDAL = ['🥇', '🥈', '🥉']

/** 排行榜：卡片组 + 奢华冠军卡 */
export default function Leaderboard() {
  const navigate = useNavigate()
  const [order, setOrder] = useState<(typeof ORDERS)[number]['k']>('win_count')
  const [list, setList] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    leaderboard(order).then((l) => {
      setList(l)
      setLoading(false)
    })
  }, [order])

  const champ = list[0]

  return (
    <div className="space-y-5">
      <PageHeader title="排行榜" sub="每周一凌晨结算，冲榜要趁早" />

      <div
        className="flex flex-wrap gap-2"
        style={{ animation: 'fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both' }}
      >
        {ORDERS.map((o, i) => (
          <button
            key={o.k}
            onClick={() => setOrder(o.k)}
            className={cn(
              'rounded-xl px-4 py-2 text-sm font-bold transition-all duration-200',
              order === o.k
                ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25'
                : 'border border-black/8 bg-white/40 text-slate-600 hover:border-indigo-500/30 hover:bg-indigo-500/5 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-indigo-500/10',
              `stagger-${i + 1}`,
            )}
          >
            {o.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="shimmer-bg h-28 rounded-2xl" />
          <div className="shimmer-bg h-20 rounded-2xl" />
          <div className="shimmer-bg h-20 rounded-2xl" />
        </div>
      ) : (
        <>
          {champ && (
            <section
              className="glass-card flex flex-wrap items-center justify-around gap-6 p-6"
              style={{ animation: 'scaleIn 0.6s cubic-bezier(0.22,1,0.36,1) .1s both' }}
            >
              <LuxuryCard value={champ.nickname} footer="champion" caption="当前榜首" />
              <LuxuryCard
                value={`Lv.${expToLevel(champ.exp)}`}
                footer="level"
                caption={`${champ.total_games} 场 · ${champ.win_count} 胜`}
              />
            </section>
          )}

          <section
            className="glass-card p-5"
            style={{ animation: 'fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) .25s both' }}
          >
            <Cards
              className="md:flex-row md:flex-wrap"
              items={list.slice(0, 12).map((p, i) => ({
                key: p.id,
                title: `${MEDAL[i] ?? ''} ${p.nickname}`,
                subtitle: `Lv.${expToLevel(p.exp)} · ${p.win_count} 胜 / ${p.total_games} 场`,
                color: i < 3 ? 'amber' : i < 6 ? 'blue' : 'green',
                icon: (
                  <img
                    src={p.avatar_url || avatarDataUri(p.nickname)}
                    className="h-5 w-5 rounded-full"
                    alt=""
                  />
                ),
                onClick: () => navigate(`/profile/${p.id}`),
                badge: `#${i + 1}`,
              }))}
            />
            {list.length === 0 && <p className="py-6 text-center text-sm opacity-40">还没有人上榜</p>}
          </section>
        </>
      )}
    </div>
  )
}
