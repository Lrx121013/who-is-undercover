import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { PageHeader, EmptyState } from '../components/Layout'
import { Cards, DoodleButton, GlassCheckbox, StrokeCheckbox } from '../components/ui'
import {
  listFriendProfiles,
  unfriend,
  blockUser,
  pushNotification,
  unblockUser,
  listPlayingMemberIds,
  listBlockedProfiles,
} from '../lib/api'
import { avatarDataUri, cn, formatTime } from '../lib/utils'
import type { Profile } from '../types/db'

type FriendState = 'online' | 'playing' | 'offline'

export default function Friends() {
  const { profile: me } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [friends, setFriends] = useState<Profile[]>([])
  const [playingIds, setPlayingIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState({ online: true, playing: true, offline: true })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [inviting, setInviting] = useState(false)
  const [inviteCode, setInviteCode] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [list, playingRows] = await Promise.all([
        listFriendProfiles(),
        listPlayingMemberIds(),
      ])
      setFriends(list)
      setPlayingIds(new Set(playingRows))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const stateOf = (f: Profile): FriendState => {
    if (playingIds.has(f.id)) return 'playing'
    if (f.show_online === false) return 'offline'
    return 'online'
  }

  const filtered = useMemo(
    () => friends.filter((f) => groups[stateOf(f)]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [friends, playingIds, groups],
  )

  const toggleSelect = (id: string) => {
    setSelected((s) => {
      const next = new Set(s)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const inviteSelected = async () => {
    if (selected.size === 0) return toast('先勾选要邀请的好友', 'error')
    if (!/^\d{4,8}$/.test(inviteCode)) return toast('先填你的房间号', 'error')
    if (!me) return
    setInviting(true)
    try {
      await Promise.all(
        [...selected].map((uid) =>
          pushNotification(uid, 'room_invite', {
            text: `${me.nickname} 邀请你加入房间`,
            room_code: inviteCode,
          }),
        ),
      )
      toast(`已向 ${selected.size} 位好友发送邀请`, 'success')
      setSelected(new Set())
    } catch (e) {
      toast((e as Error).message, 'error')
    } finally {
      setInviting(false)
    }
  }

  const STATE_LABEL: Record<FriendState, string> = {
    online: '在线',
    playing: '游戏中',
    offline: '离线',
  }
  const STATE_COLOR: Record<FriendState, string> = {
    online: 'bg-emerald-500',
    playing: 'bg-blue-500',
    offline: 'bg-slate-400',
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="我的好友"
        sub={`${friends.length} 位好友`}
        right={
          <div className="flex gap-2">
            <DoodleButton variant="B" size="sm" onClick={() => navigate('/friends/search')}>
              搜索好友
            </DoodleButton>
            <DoodleButton variant="C" size="sm" onClick={() => navigate('/friends/requests')}>
              好友申请
            </DoodleButton>
          </div>
        }
      />

      {/* 分组筛选 */}
      <section
        className="glass-card flex flex-wrap items-center gap-x-5 gap-y-3 p-4"
        style={{ animation: 'fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both' }}
      >
        <span className="text-xs font-bold opacity-50">分组筛选</span>
        {(['online', 'playing', 'offline'] as FriendState[]).map((g) => (
          <StrokeCheckbox
            key={g}
            checked={groups[g]}
            onChange={(v) => setGroups((s) => ({ ...s, [g]: v }))}
            label={
              <span className="flex items-center gap-1.5">
                <span className={cn('h-2 w-2 rounded-full', STATE_COLOR[g])} />
                {STATE_LABEL[g]}
              </span>
            }
          />
        ))}
      </section>

      {loading ? (
        <div className="space-y-3">
          <div className="shimmer-bg h-20 rounded-2xl" />
          <div className="shimmer-bg h-20 rounded-2xl" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          text="还没有好友，去搜索添加吧"
          action={
            <DoodleButton variant="C" size="sm" onClick={() => navigate('/friends/search')}>
              搜索好友
            </DoodleButton>
          }
        />
      ) : (
        <section
          className="glass-card p-5"
          style={{ animation: 'fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) .1s both' }}
        >
          <Cards
            className="md:flex-row md:flex-wrap"
            items={filtered.map((f) => ({
              key: f.id,
              title: f.nickname,
              subtitle: `${STATE_LABEL[stateOf(f)]} · Lv.${f.level}`,
              color: stateOf(f) === 'playing' ? 'blue' : stateOf(f) === 'online' ? 'green' : 'amber',
              icon: (
                <img
                  src={f.avatar_url || avatarDataUri(f.nickname)}
                  alt=""
                  className="h-6 w-6 rounded-full"
                />
              ),
              onClick: () => navigate(`/profile/${f.id}`),
              badge: `ID ${f.id.slice(0, 4)}`,
            }))}
          />
        </section>
      )}

      {/* 批量邀请 */}
      <section
        className="glass-card p-5"
        style={{ animation: 'fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) .2s both' }}
      >
        <h2 className="mb-3 flex items-center gap-2 text-sm font-black tracking-tight">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/15 to-violet-500/15 text-xs">
            💌
          </span>
          批量邀请好友进房间
        </h2>
        <p className="mb-4 text-xs opacity-40">勾选好友，并填写你的房间号，把邀请发给他们</p>
        <input
          className="input-base mb-4 max-w-xs"
          placeholder="你的房间号，如 123456"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        />
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {friends.map((f, i) => (
            <div key={f.id} className={`stagger-${(i % 6) + 1}`}>
              <GlassCheckbox
                checked={selected.has(f.id)}
                onChange={() => toggleSelect(f.id)}
                label={f.nickname}
                sub={STATE_LABEL[stateOf(f)]}
              />
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center gap-3">
          <DoodleButton variant="A" onClick={inviteSelected} loading={inviting}>
            发送邀请（{selected.size}）
          </DoodleButton>
          <span className="text-xs opacity-40">好友会在通知中心收到邀请</span>
        </div>
      </section>

      {/* 黑名单 */}
      <BlockList onChange={load} />
    </div>
  )
}

function BlockList({ onChange }: { onChange: () => void }) {
  const [blocks, setBlocks] = useState<Profile[]>([])
  useEffect(() => {
    listBlockedProfiles().then(setBlocks)
  }, [])
  if (blocks.length === 0) return null
  return (
    <section className="glass-card p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-black tracking-tight">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/15 to-violet-500/15 text-xs">
          🚫
        </span>
        黑名单
      </h2>
      <div className="flex flex-wrap gap-2">
        {blocks.map((b) => (
          <span
            key={b.id}
            className="chip border border-rose-400/30 bg-rose-500/10 text-rose-600 dark:text-rose-300"
          >
            {b.nickname}
            <button
              onClick={async () => {
                await unblockUser(b.id)
                setBlocks((bs) => bs.filter((x) => x.id !== b.id))
                onChange()
              }}
              className="ml-1 font-bold hover:underline"
            >
              解除
            </button>
          </span>
        ))}
      </div>
    </section>
  )
}
