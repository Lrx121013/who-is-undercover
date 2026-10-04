import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { PageHeader, EmptyState } from '../components/Layout'
import { BrutalInput, Cards, DoodleButton } from '../components/ui'
import { listMyPacks, listPublicPacks, likePack, deletePack, setPackPublic } from '../lib/api'
import { cn } from '../lib/utils'
import type { WordPack } from '../types/db'

/** 词库市场 / 我的词库：新粗野搜索 + 卡片组列表 */
export default function WordPacks() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile: me } = useAuth()
  const { toast } = useToast()
  const mine = location.pathname.includes('/mine')
  const [tab, setTab] = useState<'public' | 'mine'>(mine ? 'mine' : 'public')
  const [keyword, setKeyword] = useState('')
  const [packs, setPacks] = useState<WordPack[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const list = tab === 'mine' ? await listMyPacks() : await listPublicPacks()
    setPacks(list)
    setLoading(false)
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const filtered = useMemo(
    () => packs.filter((p) => !keyword.trim() || p.name.includes(keyword.trim())),
    [packs, keyword],
  )

  return (
    <div className="space-y-5">
      <PageHeader
        title={tab === 'mine' ? '我的词库' : '词库市场'}
        sub="发现好词，或者自建一套"
        right={
          <DoodleButton variant="C" onClick={() => navigate('/word-packs/create')}>
            创建词库
          </DoodleButton>
        }
      />

      <section
        className="glass-card p-5"
        style={{ animation: 'fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both' }}
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2">
            {(
              [
                { k: 'public', label: '市场' },
                { k: 'mine', label: '我的' },
              ] as const
            ).map((t) => (
              <button
                key={t.k}
                onClick={() => setTab(t.k)}
                className={cn(
                  'rounded-xl px-4 py-2 text-sm font-bold transition-all duration-200',
                  tab === t.k
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25'
                    : 'border border-black/8 bg-white/40 text-slate-600 hover:border-indigo-500/30 hover:bg-indigo-500/5 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-indigo-500/10',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <BrutalInput
            placeholder="搜索词库…"
            value={keyword}
            onChange={setKeyword}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
            }
          />
        </div>

        {loading ? (
          <div className="mt-5 space-y-3">
            <div className="shimmer-bg h-20 rounded-2xl" />
            <div className="shimmer-bg h-20 rounded-2xl" />
            <div className="shimmer-bg h-20 rounded-2xl" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8">
            <EmptyState
              text={tab === 'mine' ? '还没有自建词库' : '市场暂无词库'}
              action={
                <DoodleButton variant="C" size="sm" onClick={() => navigate('/word-packs/create')}>
                  创建词库
                </DoodleButton>
              }
            />
          </div>
        ) : (
          <div className="mt-5">
            <Cards
              className="md:flex-row md:flex-wrap"
              items={filtered.map((p) => ({
                key: p.id,
                title: p.name,
                subtitle: `${p.word_pairs?.length ?? '?'} 组词 · ${p.description || '暂无简介'}`,
                color: tab === 'mine' ? 'purple' : p.likes > 5 ? 'amber' : 'blue',
                icon: <span>📚</span>,
                badge: tab === 'mine' ? (p.is_public ? '公开' : '私有') : `❤️ ${p.likes}`,
                onClick: () => navigate(`/word-packs/${p.id}`),
              }))}
            />
          </div>
        )}

        {/* 操作列 */}
        {tab === 'mine' && filtered.length > 0 && (
          <div className="mt-5 space-y-2 border-t border-black/5 pt-4 dark:border-white/10">
            {filtered.map((p) => (
              <div key={p.id} className="flex items-center gap-3 text-sm">
                <span className="flex-1 font-bold">{p.name}</span>
                {!p.is_public && (
                  <button
                    onClick={async () => {
                      try {
                        await setPackPublic(p.id, true)
                        toast('已公开到词库市场', 'success')
                        void load()
                      } catch (e) {
                        toast((e as Error).message, 'error')
                      }
                    }}
                    className="text-xs font-bold text-indigo-500 hover:underline"
                  >
                    申请公开
                  </button>
                )}
                <button
                  onClick={async () => {
                    await deletePack(p.id)
                    toast('词库已删除', 'info')
                    void load()
                  }}
                  className="text-xs font-bold text-rose-500 hover:underline"
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
