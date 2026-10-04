import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { PageHeader, EmptyState } from '../components/Layout'
import {
  TakeOffButton,
  DoodleButton,
  GoBackButton,
  EmojiBar,
  GlassCheckbox,
  BrutalInput,
} from '../components/ui'
import {
  getRoomByCode,
  getRoomById,
  listMembers,
  listMessages,
  sendMessage,
  setReady,
  kickMember,
  transferHost,
  leaveRoom,
  startGame,
  updateRoomSettings,
  listFriendProfiles,
  pushNotification,
  subscribe,
} from '../lib/api'
import GameConfig from '../components/GameConfig'
import { roleLabel, rolePoolCounts, DEFAULT_SETTINGS, MIN_PLAYERS } from '../lib/game'
import { avatarDataUri, cn, copyText } from '../lib/utils'
import type { Message, Profile, Room, RoomMember, RoomSettings } from '../types/db'

export default function RoomLobby() {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const { profile: me } = useAuth()
  const { toast } = useToast()

  const [room, setRoom] = useState<Room | null>(null)
  const [members, setMembers] = useState<RoomMember[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [chatText, setChatText] = useState('')
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const [friends, setFriends] = useState<Profile[]>([])
  const [inviteIds, setInviteIds] = useState<Set<string>>(new Set())

  const myMember = useMemo(() => members.find((m) => m.user_id === me?.id), [members, me?.id])
  const isHost = room?.host_id === me?.id

  const load = useCallback(async () => {
    const r = await getRoomByCode(code)
    if (!r) {
      setLoading(false)
      return
    }
    setRoom(r)
    const [ms, mgs] = await Promise.all([listMembers(r.id), listMessages(r.id)])
    setMembers(ms)
    setMessages(mgs)
    setLoading(false)
  }, [code])

  useEffect(() => {
    void load()
  }, [load])

  // 实时订阅：成员 / 房间 / 聊天
  useEffect(() => {
    if (!room?.id) return
    const un1 = subscribe('room-members', 'room_members', `room_id=eq.${room.id}`, () => void load())
    const un2 = subscribe('room-itself', 'rooms', `id=eq.${room.id}`, () => {
      void getRoomById(room.id).then(setRoom)
    })
    const un3 = subscribe('room-chat', 'messages', `room_id=eq.${room.id}`, () => {
      void listMessages(room.id).then(setMessages)
    })
    return () => {
      un1()
      un2()
      un3()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.id])

  // 游戏开始后自动跳转
  useEffect(() => {
    if (room?.status === 'playing') navigate(`/rooms/${code}/game`, { replace: true })
  }, [room?.status, code, navigate])

  const toggleReady = async () => {
    if (!myMember || !room) return
    await setReady(myMember.id, !myMember.is_ready)
    setMembers((ms) => ms.map((m) => (m.id === myMember.id ? { ...m, is_ready: !m.is_ready } : m)))
  }

  const begin = async () => {
    if (!room) return
    const ready = members.filter((m) => m.is_ready || m.user_id === room.host_id)
    if (ready.length < MIN_PLAYERS) {
      toast(`至少 ${MIN_PLAYERS} 名玩家才能开始`, 'error')
      return
    }
    setStarting(true)
    try {
      await startGame(room.id)
      toast('游戏开始！', 'success')
    } catch (e) {
      toast((e as Error).message, 'error')
    } finally {
      setStarting(false)
    }
  }

  /** 房主实时改配置 */
  const patchSettings = (patch: Partial<RoomSettings>) => {
    if (!room || !isHost) return
    void updateRoomSettings(room.id, { ...DEFAULT_SETTINGS, ...room.settings, ...patch })
  }

  const sendChat = async (text?: string) => {
    const t = (text ?? chatText).trim()
    if (!t || !room) return
    setChatText('')
    await sendMessage(room.id, t)
    setMessages((m) => [
      ...m,
      {
        id: `tmp-${Date.now()}`,
        room_id: room.id,
        user_id: me?.id ?? '',
        content: t,
        created_at: new Date().toISOString(),
      },
    ])
  }

  const invite = async () => {
    if (!room || inviteIds.size === 0) return toast('先勾选好友', 'error')
    await Promise.all(
      [...inviteIds].map((uid) =>
        pushNotification(uid, 'room_invite', {
          text: `${me?.nickname ?? '好友'} 邀请你加入房间`,
          room_code: room.room_code,
        }),
      ),
    )
    toast(`已邀请 ${inviteIds.size} 位好友`, 'success')
    setInviteIds(new Set())
    setInviteOpen(false)
  }

  const exit = async () => {
    if (room) await leaveRoom(room.id).catch(() => {})
    navigate('/rooms')
  }

  if (loading) return <EmptyState text="进入房间中…" />
  if (!room)
    return (
      <EmptyState
        text="房间不存在或已关闭"
        action={
          <DoodleButton variant="B" size="sm" onClick={() => navigate('/rooms')}>
            房间大厅
          </DoodleButton>
        }
      />
    )

  const s = { ...DEFAULT_SETTINGS, ...room.settings }
  const readyCount = members.filter((m) => m.is_ready).length
  const nameOf = (uid: string) =>
    members.find((m) => m.user_id === uid)?.profiles?.nickname ?? '玩家'

  const sectionTitleCls = 'flex items-center gap-2 text-sm font-black tracking-tight'
  const sectionIconCls =
    'flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/15 to-violet-500/15 text-xs'

  return (
    <div className="space-y-5">
      <PageHeader
        title={`房间 ${room.room_code}`}
        sub={`${members.length}/${room.max_players} 人 · ${readyCount} 人已准备`}
        right={
          <div className="flex flex-wrap gap-2">
            <DoodleButton
              variant="B"
              size="sm"
              onClick={() => {
                void copyText(`${window.location.origin}/rooms/${room.room_code}`)
                toast('邀请链接已复制', 'success')
              }}
            >
              复制邀请链接
            </DoodleButton>
            <DoodleButton
              variant="A"
              size="sm"
              onClick={() => {
                listFriendProfiles().then(setFriends)
                setInviteOpen((v) => !v)
              }}
            >
              邀请好友
            </DoodleButton>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* 成员列表 */}
        <section
          className="glass-card p-5 lg:col-span-2"
          style={{ animation: 'fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both' }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className={sectionTitleCls}>
              <span className={sectionIconCls}>👥</span>
              玩家（{members.length}）
            </h2>
            {isHost && (
              <DoodleButton variant="C" size="sm" onClick={begin} loading={starting}>
                开始游戏
              </DoodleButton>
            )}
          </div>

          <div className="space-y-2">
            {members.map((m, i) => (
              <div
                key={m.id}
                className={cn(
                  'flex items-center gap-3 rounded-xl border p-3 transition-all duration-200',
                  m.is_ready
                    ? 'border-emerald-400/40 bg-emerald-500/5'
                    : 'border-black/5 bg-black/[0.02] dark:border-white/10 dark:bg-white/5',
                  `stagger-${(i % 6) + 1}`,
                )}
              >
                <img
                  src={m.profiles?.avatar_url || avatarDataUri(m.profiles?.nickname ?? '玩')}
                  alt=""
                  className="h-10 w-10 rounded-xl"
                />
                <div className="flex-1">
                  <p className="text-sm font-bold">
                    {m.profiles?.nickname ?? '玩家'}
                    {m.user_id === room.host_id && (
                      <span className="ml-2 chip bg-amber-400/20 text-amber-600 dark:text-amber-300">
                        房主
                      </span>
                    )}
                  </p>
                  <p className="text-xs opacity-50">{m.is_ready ? '✅ 已准备' : '⏳ 未准备'}</p>
                </div>
                {isHost && m.user_id !== room.host_id && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={async () => {
                        await transferHost(room.id, m.user_id)
                        toast('已转让房主', 'success')
                      }}
                      className="rounded-lg border border-black/10 px-2 py-1 text-xs font-bold dark:border-white/10"
                    >
                      转让
                    </button>
                    <button
                      onClick={async () => {
                        await kickMember(room.id, m.user_id)
                        toast('已踢出', 'info')
                      }}
                      className="rounded-lg border border-rose-400/30 px-2 py-1 text-xs font-bold text-rose-500"
                    >
                      踢人
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 准备按钮 */}
          <div className="mt-5 flex flex-col items-center gap-3">
            <TakeOffButton
              label="准 备"
              sentLabel="已准备"
              compact={myMember?.is_ready}
              onAction={toggleReady}
            />
            {myMember?.is_ready && (
              <button onClick={toggleReady} className="text-xs opacity-50 hover:underline">
                取消准备
              </button>
            )}
            <GoBackButton onClick={exit} />
          </div>
        </section>

        {/* 右侧：设置 + 表情 + 聊天 */}
        <div className="space-y-4">
          <section
            className="glass-card p-5"
            style={{ animation: 'fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) .1s both' }}
          >
            <h2 className={sectionTitleCls}>
              <span className={sectionIconCls}>⚙️</span>
              房间设置
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              <li className="flex justify-between">
                <span className="opacity-50">人数上限</span>
                <b>{room.max_players} 人</b>
              </li>
              <li className="flex justify-between">
                <span className="opacity-50">发言限时</span>
                <b>{s.enable_timer === false ? '无限时' : `${s.speak_time}s`}</b>
              </li>
              <li className="flex justify-between">
                <span className="opacity-50">发言顺序</span>
                <b>
                  {s.speak_order === 'cw' ? '顺时针' : s.speak_order === 'ccw' ? '逆时针' : '随机'}
                </b>
              </li>
              <li className="flex justify-between">
                <span className="opacity-50">投票器</span>
                <b>{s.enable_vote === false ? '手动淘汰' : '开启'}</b>
              </li>
              <li className="flex justify-between">
                <span className="opacity-50">难度</span>
                <b>{'★'.repeat(s.difficulty ?? 3)}</b>
              </li>
            </ul>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {rolePoolCounts(Math.max(members.length, MIN_PLAYERS), s).map(({ role, count }) => (
                <span
                  key={role}
                  className="chip bg-indigo-500/10 text-xs text-indigo-600 dark:text-indigo-300"
                >
                  {roleLabel(role)} ×{count}
                </span>
              ))}
            </div>
            <div className="mt-4 space-y-2.5 border-t border-black/5 pt-4 dark:border-white/10">
              {room.password ? (
                <p className="text-xs faint">本房间有密码 · 加入时需输入</p>
              ) : (
                <p className="text-xs faint">本房间无密码 · 任何人可加入</p>
              )}
              {isHost && (
                <DoodleButton variant="B" size="sm" onClick={() => setConfigOpen((v) => !v)}>
                  {configOpen ? '收起自由配置' : '自由配置'}
                </DoodleButton>
              )}
            </div>
            {configOpen && isHost && (
              <div className="mt-4 border-t border-black/5 pt-4 dark:border-white/10">
                <GameConfig settings={s} onChange={patchSettings} playerCap={room.max_players} />
              </div>
            )}
          </section>

          <section
            className="glass-card p-5"
            style={{ animation: 'fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) .2s both' }}
          >
            <h2 className={sectionTitleCls}>
              <span className={sectionIconCls}>🎉</span>
              表情互动
            </h2>
            <div className="mt-3">
              <EmojiBar onSelect={(e) => sendChat(e)} />
            </div>
          </section>

          <section
            className="glass-card flex h-72 flex-col p-5"
            style={{ animation: 'fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) .3s both' }}
          >
            <h2 className={sectionTitleCls}>
              <span className={sectionIconCls}>💬</span>
              房间聊天
            </h2>
            <div className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1">
              {messages.map((m) => (
                <p key={m.id} className="text-sm">
                  <b className="text-indigo-500 dark:text-indigo-300">{nameOf(m.user_id)}</b>
                  <span className="ml-2 break-all">{m.content}</span>
                </p>
              ))}
              {messages.length === 0 && (
                <p className="text-xs opacity-40">说点什么活跃下气氛…</p>
              )}
            </div>
            <div className="mt-3">
              <BrutalInput
                placeholder="快捷聊天…"
                value={chatText}
                onChange={setChatText}
                onEnter={() => sendChat()}
                maxLength={60}
                full
              />
            </div>
          </section>
        </div>
      </div>

      {/* 邀请好友抽屉 */}
      {inviteOpen && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 backdrop-blur-sm md:place-items-center">
          <div className="glass-card w-full max-w-md p-6">
            <h3 className="text-lg font-black">邀请好友进房间</h3>
            <div className="mt-4 max-h-72 space-y-3 overflow-y-auto">
              {friends.length === 0 && <p className="text-sm opacity-40">暂无好友，先去添加几个吧</p>}
              {friends.map((f) => (
                <GlassCheckbox
                  key={f.id}
                  checked={inviteIds.has(f.id)}
                  onChange={() =>
                    setInviteIds((prev) => {
                      const n = new Set(prev)
                      if (n.has(f.id)) n.delete(f.id)
                      else n.add(f.id)
                      return n
                    })
                  }
                  label={f.nickname}
                  sub={`Lv.${f.level}`}
                />
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between">
              <DoodleButton variant="C" onClick={invite}>
                发送邀请（{inviteIds.size}）
              </DoodleButton>
              <DoodleButton variant="B" size="sm" onClick={() => setInviteOpen(false)}>
                关闭
              </DoodleButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
