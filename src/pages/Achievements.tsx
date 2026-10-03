import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader, EmptyState } from '../components/Layout'
import { LuxuryCard } from '../components/ui'
import { listAchievements, myAchievements } from '../lib/api'
import { cn } from '../lib/utils'
import type { Achievement, UserAchievement } from '../types/db'

/** 成就墙：奢华卡片展示已解锁成就 */
export default function Achievements() {
  const navigate = useNavigate()
  const [all, setAll] = useState<Achievement[]>([])
  const [mine, setMine] = useState<UserAchievement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([listAchievements(), myAchievements()]).then(([a, m]) => {
      setAll(a)
      setMine(m)
      setLoading(false)
    })
  }, [])

  const unlockedIds = new Set(mine.map((m) => m.achievement_id))
  const unlockedCount = all.filter((a) => unlockedIds.has(a.id)).length

  return (
    <div className="space-y-5">
      <PageHeader
        title="成就徽章墙"
        sub={loading ? '加载中…' : `已解锁 ${unlockedCount}/${all.length}`}
        right={
          <span className="chip flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold">
            🎖️ 完成度 {all.length ? Math.round((unlockedCount / all.length) * 100) : 0}%
          </span>
        }
      />

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="shimmer-bg h-40 rounded-2xl" />
          <div className="shimmer-bg h-40 rounded-2xl" />
          <div className="shimmer-bg h-40 rounded-2xl" />
        </div>
      ) : all.length === 0 ? (
        <EmptyState text="暂无成就数据" action={undefined} />
      ) : (
        <div
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          style={{ animation: 'fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both' }}
        >
          {all.map((a, i) => {
            const got = unlockedIds.has(a.id)
            return (
              <div
                key={a.id}
                className={cn(
                  'glass-card flex flex-col items-center gap-3 p-5 transition-all duration-300',
                  got
                    ? 'border-amber-400/30 hover:-translate-y-1'
                    : 'opacity-45 grayscale hover:opacity-70',
                  `stagger-${(i % 6) + 1}`,
                )}
              >
                <LuxuryCard value={a.name} footer={a.icon || 'locked'} caption={got ? '已解锁' : '未解锁'} />
                <p className="max-w-[220px] text-center text-xs opacity-50">{a.description}</p>
                <button
                  onClick={() => navigate('/home')}
                  className={cn(
                    'text-xs font-bold transition hover:opacity-80',
                    got ? 'text-emerald-500 dark:text-emerald-300' : 'opacity-50 hover:underline',
                  )}
                >
                  {got ? '✓ 已获得' : '去完成 →'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
