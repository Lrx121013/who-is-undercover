import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { PageHeader, EmptyState } from '../components/Layout'
import { DoodleButton } from '../components/ui'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribe,
} from '../lib/api'
import { cn, formatTime } from '../lib/utils'
import type { NotificationRow } from '../types/db'

const TYPE_META: Record<string, { icon: string; label: string }> = {
  friend_request: { icon: '🤝', label: '好友申请' },
  room_invite: { icon: '🎮', label: '房间邀请' },
  achievement: { icon: '🎖️', label: '成就解锁' },
  system: { icon: '📢', label: '系统公告' },
}

export default function Notifications() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const uid = session?.user?.id
  const [rows, setRows] = useState<NotificationRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const all = await listNotifications()
    setRows(all.filter((r) => r.user_id === uid))
    setLoading(false)
  }, [uid])

  useEffect(() => {
    void load()
    if (!uid) return
    const un = subscribe('notify-page', 'notifications', `user_id=eq.${uid}`, () => void load())
    return un
  }, [uid, load])

  const open = async (n: NotificationRow) => {
    await markNotificationRead(n.id)
    setRows((rs) => rs.map((r) => (r.id === n.id ? { ...r, is_read: true } : r)))
    const c = n.content as Record<string, string>
    if (n.type === 'friend_request') navigate('/friends/requests')
    else if (n.type === 'room_invite' && c?.room_code) navigate(`/rooms/${c.room_code}`)
    else if (n.type === 'achievement') navigate('/achievements')
  }

  const unread = rows.filter((r) => !r.is_read).length

  return (
    <div className="space-y-5">
      <PageHeader
        title="通知中心"
        sub={unread > 0 ? `${unread} 条未读` : '全部已读'}
        right={
          rows.length > 0 && (
            <DoodleButton
              variant="B"
              size="sm"
              onClick={async () => {
                await markAllNotificationsRead()
                setRows((rs) => rs.map((r) => ({ ...r, is_read: true })))
              }}
            >
              全部已读
            </DoodleButton>
          )
        }
      />

      {loading ? (
        <div className="space-y-3">
          <div className="shimmer-bg h-16 rounded-2xl" />
          <div className="shimmer-bg h-16 rounded-2xl" />
          <div className="shimmer-bg h-16 rounded-2xl" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState text="还没有通知，去邀请好友来玩吧" />
      ) : (
        <div className="space-y-2">
          {rows.map((n, i) => {
            const meta = TYPE_META[n.type] ?? TYPE_META.system
            const c = n.content as Record<string, string>
            return (
              <button
                key={n.id}
                onClick={() => open(n)}
                className={cn(
                  'glass-card flex w-full items-center gap-3 p-4 text-left transition-all duration-200 hover:-translate-y-0.5',
                  !n.is_read && 'border-indigo-500/30 bg-indigo-500/5 dark:border-indigo-400/30',
                  `stagger-${(i % 6) + 1}`,
                )}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/12 to-violet-500/12 text-xl">
                  {meta.icon}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-bold">
                    {meta.label}
                    <span className="ml-2 text-xs font-normal opacity-40">{formatTime(n.created_at)}</span>
                  </p>
                  <p className="mt-0.5 text-xs opacity-40">
                    {c?.text || c?.message || (c?.room_code ? `房间号 ${c.room_code}` : '') || '—'}
                  </p>
                </div>
                {!n.is_read && (
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-indigo-500 animate-pulse-soft" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
