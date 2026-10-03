import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { PageHeader, EmptyState } from '../components/Layout'
import { DoodleButton, UserProfileButton } from '../components/ui'
import { listIncomingRequests, listOutgoingRequests, respondRequest } from '../lib/api'
import { avatarDataUri, formatTime } from '../lib/utils'
import type { FriendRequest, Profile } from '../types/db'

export default function FriendRequests() {
  const { session } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const uid = session?.user?.id
  const [incoming, setIncoming] = useState<(FriendRequest & { from: Profile })[]>([])
  const [outgoing, setOutgoing] = useState<(FriendRequest & { to: Profile })[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!uid) return
    const [i, o] = await Promise.all([listIncomingRequests(uid), listOutgoingRequests(uid)])
    setIncoming(i)
    setOutgoing(o)
    setLoading(false)
  }, [uid])

  useEffect(() => {
    void load()
  }, [load])

  const respond = async (id: string, action: 'accepted' | 'rejected') => {
    try {
      await respondRequest(id, action)
      toast(action === 'accepted' ? '已添加好友' : '已拒绝', 'success')
      await load()
    } catch (e) {
      toast((e as Error).message, 'error')
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader back title="好友申请" sub="申请 7 天后自动过期" />

      {loading ? (
        <p className="py-10 text-center text-sm muted">加载中…</p>
      ) : (
        <>
          <section className="panel p-5">
            <h2 className="section-title">📥 收到的申请（{incoming.length}）</h2>
            {incoming.length === 0 ? (
              <p className="py-4 text-sm muted">暂无新申请</p>
            ) : (
              <div className="space-y-2">
                {incoming.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-black/5 bg-black/[0.02] p-3 dark:border-white/10 dark:bg-white/5"
                  >
                    <UserProfileButton
                      size="sm"
                      avatarUrl={r.from?.avatar_url || avatarDataUri(r.from?.nickname ?? '友')}
                      onClick={() => navigate(`/profile/${r.from_user}`)}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-bold">{r.from?.nickname ?? '未知用户'}</p>
                      <p className="text-xs muted">
                        {r.message || '请求添加你为好友'} · {formatTime(r.created_at)}
                      </p>
                    </div>
                    <DoodleButton variant="C" size="sm" onClick={() => respond(r.id, 'accepted')}>
                      同意
                    </DoodleButton>
                    <DoodleButton variant="B" size="sm" onClick={() => respond(r.id, 'rejected')}>
                      拒绝
                    </DoodleButton>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="panel p-5">
            <h2 className="section-title">📤 发出的申请（{outgoing.length}）</h2>
            {outgoing.length === 0 ? (
              <p className="py-4 text-sm muted">暂无待处理申请</p>
            ) : (
              <div className="space-y-2">
                {outgoing.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 rounded-xl border border-black/5 bg-black/[0.02] p-3 dark:border-white/10 dark:bg-white/5"
                  >
                    <UserProfileButton
                      size="sm"
                      avatarUrl={r.to?.avatar_url || avatarDataUri(r.to?.nickname ?? '友')}
                      onClick={() => navigate(`/profile/${r.to_user}`)}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-bold">{r.to?.nickname ?? '未知用户'}</p>
                      <p className="text-xs muted">{r.message || '等待对方验证'} · {formatTime(r.created_at)}</p>
                    </div>
                    <span className="chip bg-amber-400/20 text-amber-600 dark:text-amber-300">等待验证</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
