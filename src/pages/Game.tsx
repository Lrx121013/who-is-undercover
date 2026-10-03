import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { PageHeader, EmptyState } from '../components/Layout'
import {
  Box3DLoader,
  StrokeCheckbox,
  DashSpinLoader,
  DoodleButton,
  EmojiBar,
  BrutalInput,
} from '../components/ui'
import SpeakTimer from '../components/SpeakTimer'
import {
  getRoomByCode,
  getRoomById,
  listMembers,
  listMessages,
  listVotes,
  sendMessage,
  setPhase,
  settleRound,
  submitVote,
  eliminateMember,
  investigate,
  subscribe,
} from '../lib/api'
import {
  checkWinner,
  DEFAULT_SETTINGS,
  makeSpeakOrderIds,
  resolveVotes,
  roleLabel,
} from '../lib/game'
import { supabase } from '../lib/supabase'
import { avatarDataUri, cn, mergeMessage, playBeep } from '../lib/utils'
import { usePrefs } from '../hooks/usePrefs'
import type { Message, Room, RoomMember, VoteRow } from '../types/db'

/** 游戏进行中：发牌（3D 盒子）→ 发言（时钟计时）→ 投票 / 手动淘汰 → 结算胜负 */
export default function Game() {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const { profile: me } = useAuth()
  const { toast } = useToast()
  const { prefs } = usePrefs()

  const [room, setRoom] = useState<Room | null>(null)
  const [members, setMembers] = useState<RoomMember[]>([])
  const [votes, setVotes] = useState<VoteRow[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [chatText, setChatText] = useState('')
  const [loading, setLoading] = useState(true)
  const [revealWord, setRevealWord] = useState(false)
  const [myVote, setMyVote] = useState<string | null>(null)
  const [checkTarget, setCheckTarget] = useState('')
  const [checkResult, setCheckResult] = useState<string | null>(null)
  const [banner, setBanner] = useState<string | null>(null)
  const prevAlive = useRef<Set<string> | null>(null)

  const s = { ...DEFAULT_SETTINGS, ...room?.settings }
  const phase = s.game_phase ?? 'deal'
  const round = s.round ?? 1
  const voteEnabled = s.enable_vote ?? true
  const isHost = room?.host_id === me?.id
  const myMember = members.find((m) => m.user_id === me?.id)
  const alive = members.filter((m) => m.is_alive)
  const aliveOthers = alive.filter((m) => m.user_id !== me?.id)
  const orderIds = (s.speak_order_ids ?? []).filter((id) => alive.some((m) => m.user_id === id))
  const speakerIdx = s.current_speaker ? orderIds.indexOf(s.current_speaker) : 0

  const load = useCallback(async () => {
    const r = await getRoomByCode(code)
    if (!r) return
    setRoom(r)
    const [ms, vs, msgs] = await Promise.all([
      listMembers(r.id),
      listVotes(r.id, r.settings?.round ?? 1),
      listMessages(r.id),
    ])
    setMembers(ms)
    setVotes(vs)
    setMessages(msgs)
    setLoading(false)
  }, [code])

  const roundRef = useRef(round)
  useEffect(() => {
    roundRef.current = round
  }, [round])

  useEffect(() => {
    void load()
  }, [load])

  // 实时同步：成员状态 / 房间阶段 / 投票
  useEffect(() => {
    if (!room?.id) return
    const un1 = subscribe('game-members', 'room_members', `room_id=eq.${room.id}`, () => {
      void listMembers(room.id).then(setMembers)
    })
    const un2 = subscribe('game-room', 'rooms', `id=eq.${room.id}`, () => {
      void getRoomById(room.id).then((r) => r && setRoom(r))
    })
    const un3 = subscribe('game-votes', 'votes', `room_id=eq.${room.id}`, () => {
      void listVotes(room.id, roundRef.current).then(setVotes)
    })
    const un4 = subscribe('game-chat', 'messages', `room_id=eq.${room.id}`, (payload) => {
      const row = (payload as { new: Message }).new
      if (row) setMessages((m) => mergeMessage(m, row))
    })
    return () => {
      un1()
      un2()
      un3()
      un4()
    }
  }, [room?.id])

  // 淘汰横幅（对比存活变化）
  useEffect(() => {
    const nowAlive = new Set(alive.map((m) => m.user_id))
    if (prevAlive.current) {
      const out = members.find((m) => prevAlive.current?.has(m.user_id) && !m.is_alive)
      if (out) setBanner(`${out.profiles?.nickname ?? '玩家'} 被投出局（${roleLabel(out.role)}）`)
    }
    prevAlive.current = nowAlive
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members])

  // 每轮重置本地操作状态
  useEffect(() => {
    setMyVote(null)
    setCheckResult(null)
    setCheckTarget('')
  }, [round])

  // 轮到我发言时按偏好提示（音效 / 震动），同一轮只提醒一次
  const alertedRef = useRef<string | null>(null)
  useEffect(() => {
    if (phase !== 'speak' || s.current_speaker !== me?.id) return
    const key = `${round}-${s.current_speaker}`
    if (alertedRef.current === key) return
    alertedRef.current = key
    if (prefs.sound) playBeep(920, 220)
    if (prefs.vibrate && typeof navigator !== 'undefined' && navigator.vibrate)
      navigator.vibrate(220)
  }, [phase, s.current_speaker, round, me?.id, prefs.sound, prefs.vibrate])

  // 房主推进：发牌结束进入发言；新一轮生成统一发言顺序
  useEffect(() => {
    if (!isHost || !room) return
    const timerOn = s.enable_timer ?? true
    const endsAt = () => (timerOn ? Date.now() + (s.speak_time ?? 60) * 1000 : null)
    if (phase === 'deal') {
      const t = window.setTimeout(() => {
        const ids = makeSpeakOrderIds(members, s)
        void setPhase(room.id, {
          game_phase: 'speak',
          round: 1,
          current_speaker: ids[0] ?? null,
          phase_ends_at: endsAt(),
          speak_order_ids: ids,
        })
      }, 2400)
      return () => window.clearTimeout(t)
    }
    if (phase === 'speak' && !s.current_speaker && alive.length > 0) {
      const ids = orderIds.length ? orderIds : makeSpeakOrderIds(members, s)
      void setPhase(room.id, {
        current_speaker: ids[0] ?? null,
        phase_ends_at: endsAt(),
        speak_order_ids: ids,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, phase, room?.id, round, alive.length, s.current_speaker])

  const nextSpeaker = async () => {
    if (!room || !isHost) return
    const timerOn = s.enable_timer ?? true
    const ids = orderIds.length ? orderIds : makeSpeakOrderIds(alive, s)
    const next = ids[ids.indexOf(s.current_speaker ?? '') + 1]
    if (next) {
      await setPhase(room.id, {
        game_phase: 'speak',
        current_speaker: next,
        phase_ends_at: timerOn ? Date.now() + (s.speak_time ?? 60) * 1000 : null,
      })
    } else {
      await setPhase(room.id, {
        game_phase: 'vote',
        current_speaker: null,
        phase_ends_at: null,
      })
    }
  }

  // 计时结束自动下一位
  const onTimerEnd = () => {
    if (isHost && phase === 'speak') void nextSpeaker()
  }

  const finishRpc = async (roomId: string, winner: string) => {
    const { error } = await supabase.rpc('finish_game', { p_room: roomId, p_winner: winner })
    if (error) throw new Error(error.message)
  }

  const settle = async () => {
    if (!room) return
    try {
      const winner = await settleRound(room.id)
      if (winner) {
        await finishRpc(room.id, winner)
        navigate(`/rooms/${code}/result`, { replace: true })
      } else {
        setBanner(null)
        void load()
      }
    } catch (e) {
      toast((e as Error).message, 'error')
    }
  }

  // 全部投票后自动结算
  useEffect(() => {
    if (!isHost || !room || phase !== 'vote' || !voteEnabled) return
    if (alive.length === 0 || votes.length < alive.length) return
    const t = window.setTimeout(() => void settle(), 800)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [votes.length, phase, isHost, alive.length, voteEnabled])

  const doVote = async (target: string) => {
    if (!room || !myMember) return
    if (votes.some((v) => v.voter_id === me?.id)) return toast('本轮已投票', 'error')
    setMyVote(target)
    try {
      await submitVote(room.id, round, target)
      setVotes(await listVotes(room.id, round))
      toast('投票已提交', 'success')
    } catch (e) {
      toast((e as Error).message, 'error')
    }
  }

  // 关闭投票器时：房主手动淘汰一名玩家
  const manualEliminate = async (targetId: string) => {
    if (!room || !isHost) return
    try {
      await eliminateMember(room.id, targetId)
      setMembers(await listMembers(room.id))
      const winner = await settleRound(room.id)
      if (winner) {
        await finishRpc(room.id, winner)
        navigate(`/rooms/${code}/result`, { replace: true })
      } else {
        setBanner(null)
        void load()
      }
    } catch (e) {
      toast((e as Error).message, 'error')
    }
  }

  const chatName = (uid: string) =>
    members.find((m) => m.user_id === uid)?.profiles?.nickname ?? '玩家'

  const sendChat = async (text?: string) => {
    const t = (text ?? chatText).trim().slice(0, 60)
    if (!t || !room || !me) return
    setChatText('')
    setMessages((m) => [
      ...m,
      {
        id: `tmp-${Date.now()}`,
        room_id: room.id,
        user_id: me.id,
        content: t,
        created_at: new Date().toISOString(),
      },
    ])
    await sendMessage(room.id, t).catch(() => {})
  }

  const tally = resolveVotes(votes, alive.map((m) => m.user_id))

  if (loading) return <EmptyState text="进入对局…" />
  if (!room)
    return (
      <EmptyState
        text="对局不存在"
        action={
          <DoodleButton variant="B" size="sm" onClick={() => navigate('/rooms')}>
            房间大厅
          </DoodleButton>
        }
      />
    )

  const winner = checkWinner(members)
  const currentName =
    members.find((m) => m.user_id === s.current_speaker)?.profiles?.nickname ?? '玩家'

  return (
    <div className="space-y-5">
      <PageHeader
        title={`第 ${round} 轮`}
        sub={
          phase === 'deal'
            ? '正在发牌…'
            : phase === 'speak'
              ? `${s.current_speaker === me?.id ? '轮到你发言！' : '等待玩家发言…'}（${speakerIdx + 1}/${orderIds.length}）`
              : phase === 'vote'
                ? voteEnabled
                  ? `投票阶段 · 已投 ${votes.length}/${alive.length}`
                  : '主持人正在选择出局者…'
                : '结算中…'
        }
        right={
          <span className="chip flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse-soft" />
            存活 {alive.length} 人
          </span>
        }
      />

      {banner && (
        <div className="glass-card flex flex-wrap items-center justify-center gap-3 border-rose-300/30 bg-rose-500/10 p-4 text-center text-sm font-bold text-rose-500 dark:text-rose-300">
          💀 {banner}
          <button className="text-xs opacity-50 hover:underline" onClick={() => setBanner(null)}>
            知道了
          </button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* 我的身份牌 */}
          <section
            className="glass-card p-6 text-center"
            style={{ animation: 'fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both' }}
          >
            <p className="text-xs font-bold tracking-widest opacity-40">我的身份</p>
            <h2 className="mt-1 text-3xl font-black text-indigo-500 dark:text-indigo-300">
              {roleLabel(myMember?.role ?? null)}
            </h2>
            <div className="mt-5">
              {myMember?.word ? (
                <>
                  <div
                    className={cn(
                      'mx-auto flex h-28 w-52 select-none flex-col items-center justify-center rounded-2xl border-2 text-2xl font-black transition-all duration-200',
                      revealWord
                        ? 'border-indigo-500 bg-indigo-500/10 text-slate-900 dark:text-white'
                        : 'border-dashed border-black/20 text-slate-300 dark:border-white/20 dark:text-white/20',
                    )}
                    onMouseDown={() => setRevealWord(true)}
                    onMouseUp={() => setRevealWord(false)}
                    onMouseLeave={() => setRevealWord(false)}
                    onTouchStart={() => setRevealWord(true)}
                    onTouchEnd={() => setRevealWord(false)}
                    onClick={() => setRevealWord((v) => !v)}
                  >
                    {revealWord ? (
                      myMember.word
                    ) : (
                      <span className="text-sm font-bold">按住查看我的词</span>
                    )}
                  </div>
                  <p className="mt-3 text-xs opacity-40">按住卡片显示词，松手立即隐藏（防偷看）</p>
                </>
              ) : (
                <div className="mx-auto flex h-28 w-52 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-amber-400/50 bg-amber-400/5 text-sm font-bold text-amber-600 dark:text-amber-300">
                  {myMember?.role === 'white'
                    ? '你是白板：没有词，靠听别人描述蒙混过关'
                    : myMember?.role === 'third_party'
                      ? '你的目标是存活到最后，达成第三方胜利'
                      : '等待发牌…'}
                </div>
              )}
            </div>

            {/* 侦探技能 */}
            {myMember?.role === 'detective' && (
              <div className="mx-auto mt-5 max-w-xs rounded-xl border border-black/8 p-4 dark:border-white/10">
                <p className="text-xs font-bold opacity-40">🔍 侦探技能：查验一人是否卧底</p>
                <div className="mt-2 flex gap-2">
                  <select
                    className="input-base"
                    value={checkTarget}
                    onChange={(e) => setCheckTarget(e.target.value)}
                  >
                    <option value="">选择玩家</option>
                    {aliveOthers.map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.profiles?.nickname}
                      </option>
                    ))}
                  </select>
                  <DoodleButton
                    variant="B"
                    size="sm"
                    onClick={async () => {
                      const t = members.find((m) => m.user_id === checkTarget)
                      if (!t || !room) return
                      try {
                        const isUc = await investigate(room.id, checkTarget)
                        setCheckResult(`${t.profiles?.nickname} ${isUc ? '是' : '不是'}卧底`)
                      } catch (e) {
                        toast((e as Error).message, 'error')
                      }
                    }}
                  >
                    查验
                  </DoodleButton>
                </div>
                {checkResult && (
                  <p className="mt-2 text-sm font-bold text-indigo-500 dark:text-indigo-300">
                    {checkResult}
                  </p>
                )}
              </div>
            )}

            {/* 预言家技能 */}
            {myMember?.role === 'prophet' && myMember.is_alive && (
              <div className="mx-auto mt-5 max-w-xs rounded-xl border border-black/8 p-4 text-sm dark:border-white/10">
                <p className="text-xs font-bold opacity-40">🔮 预言家：场上仍有</p>
                <p className="mt-1 text-2xl font-black text-indigo-500 dark:text-indigo-300">
                  {alive.filter((m) => m.role === 'undercover').length} 名卧底
                </p>
              </div>
            )}
          </section>

          {/* 阶段主体 */}
          {phase === 'deal' && <Box3DLoader text="正在发牌，请查看自己的词…" />}

          {phase === 'speak' && (
            <section className="glass-card flex flex-col items-center gap-4 p-6">
              <p className="text-xs font-bold tracking-widest opacity-40">正在发言</p>
              {s.current_speaker ? (
                <>
                  <img
                    src={
                      members.find((m) => m.user_id === s.current_speaker)?.profiles?.avatar_url ||
                      avatarDataUri(currentName)
                    }
                    className="h-16 w-16 rounded-2xl shadow-lg"
                    alt=""
                  />
                  <h3 className="text-xl font-black">{currentName}</h3>
                </>
              ) : (
                <p className="text-sm opacity-50">准备中…</p>
              )}
              <SpeakTimer
                total={s.speak_time ?? 60}
                endsAt={s.enable_timer ? s.phase_ends_at ?? null : null}
                onEnd={onTimerEnd}
                label={s.enable_timer ? '剩余秒数' : '无限时'}
              />
              {isHost ? (
                <DoodleButton variant="C" onClick={nextSpeaker}>
                  {speakerIdx + 1 >= orderIds.length ? '结束发言，开始投票' : '下一位发言'}
                </DoodleButton>
              ) : (
                <div className="flex items-center gap-2 text-sm opacity-50">
                  <DashSpinLoader size={20} /> 等待玩家发言…
                </div>
              )}
            </section>
          )}

          {phase === 'vote' && (
            <section className="glass-card p-6">
              {!voteEnabled ? (
                <>
                  <h2 className="mb-4 flex items-center gap-2 text-sm font-black tracking-tight">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/15 to-violet-500/15 text-xs">
                      🗡️
                    </span>
                    主持人决定出局者
                  </h2>
                  {isHost ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {alive.map((m) => (
                        <button
                          key={m.user_id}
                          onClick={() => manualEliminate(m.user_id)}
                          className="flex items-center gap-2 rounded-xl border border-black/8 p-3 text-left text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 hover:border-rose-400/40 hover:bg-rose-500/5 dark:border-white/10"
                        >
                          <img
                            src={
                              m.profiles?.avatar_url || avatarDataUri(m.profiles?.nickname ?? '玩')
                            }
                            className="h-6 w-6 rounded-full"
                            alt=""
                          />
                          {m.profiles?.nickname}
                          <span className="ml-auto text-xs opacity-40">淘汰</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-6">
                      <DashSpinLoader size={32} />
                      <p className="text-sm opacity-50">等待主持人选择出局者…</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h2 className="mb-4 flex items-center gap-2 text-sm font-black tracking-tight">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/15 to-violet-500/15 text-xs">
                      🗳️
                    </span>
                    投票：你觉得谁是卧底？
                  </h2>
                  {myMember && !myMember.is_alive ? (
                    <p className="py-6 text-center text-sm opacity-50">你已被淘汰，观战中…</p>
                  ) : votes.some((v) => v.voter_id === me?.id) ? (
                    <div className="flex flex-col items-center gap-2 py-6">
                      <DashSpinLoader size={32} />
                      <p className="text-sm opacity-50">已投票，等待其他玩家…</p>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {aliveOthers.map((m) => (
                        <StrokeCheckbox
                          key={m.user_id}
                          checked={myVote === m.user_id}
                          onChange={() => setMyVote(m.user_id)}
                          label={
                            <span className="flex items-center gap-2">
                              <img
                                src={
                                  m.profiles?.avatar_url ||
                                  avatarDataUri(m.profiles?.nickname ?? '玩')
                                }
                                className="h-5 w-5 rounded-full"
                                alt=""
                              />
                              {m.profiles?.nickname}
                            </span>
                          }
                        />
                      ))}
                    </div>
                  )}

                  {myVote && !votes.some((v) => v.voter_id === me?.id) && (
                    <div className="mt-5 flex justify-center">
                      <DoodleButton variant="A" onClick={() => doVote(myVote)}>
                        提交投票
                      </DoodleButton>
                    </div>
                  )}

                  {isHost && (
                    <div className="mt-6 border-t border-black/5 pt-4 dark:border-white/10">
                      <div className="mb-3 flex flex-wrap gap-2 text-xs">
                        {alive.map((m) => (
                          <span key={m.user_id} className="chip bg-black/5 dark:bg-white/10">
                            {m.profiles?.nickname}: {tally.counts[m.user_id] ?? 0} 票
                            {votes.some((v) => v.voter_id === m.user_id) ? ' ✓' : ''}
                          </span>
                        ))}
                      </div>
                      <DoodleButton variant="B" size="sm" onClick={() => void settle()}>
                        强制结算本轮
                      </DoodleButton>
                    </div>
                  )}
                </>
              )}
            </section>
          )}
        </div>

        {/* 右侧：存活玩家 */}
        <section
          className="glass-card h-fit p-5"
          style={{ animation: 'fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) .15s both' }}
        >
          <h2 className="mb-3 flex items-center gap-2 text-sm font-black tracking-tight">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/15 to-violet-500/15 text-xs">
              🧑‍🤝‍🧑
            </span>
            存活玩家（{alive.length}）
          </h2>
          <div className="space-y-2">
            {alive.map((m) => (
              <div
                key={m.user_id}
                className={cn(
                  'flex items-center gap-2 rounded-xl border p-2.5 transition-all',
                  m.user_id === me?.id
                    ? 'border-indigo-500/40 bg-indigo-500/5'
                    : 'border-black/5 dark:border-white/10',
                )}
              >
                <img
                  src={m.profiles?.avatar_url || avatarDataUri(m.profiles?.nickname ?? '玩')}
                  className="h-8 w-8 rounded-lg"
                  alt=""
                />
                <span className="flex-1 text-sm font-bold">
                  {m.profiles?.nickname}
                  {m.user_id === me?.id && <span className="ml-1 text-xs opacity-40">（我）</span>}
                </span>
                {s.current_speaker === m.user_id && <span className="text-xs">🎤</span>}
              </div>
            ))}
          </div>
          {members.some((m) => !m.is_alive) && (
            <>
              <h2 className="mb-3 mt-5 flex items-center gap-2 text-sm font-black tracking-tight">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/15 to-violet-500/15 text-xs">
                  👻
                </span>
                已淘汰
              </h2>
              <div className="space-y-2 opacity-50">
                {members
                  .filter((m) => !m.is_alive)
                  .map((m) => (
                    <div
                      key={m.user_id}
                      className="flex items-center gap-2 rounded-xl border border-black/5 p-2.5 dark:border-white/10"
                    >
                      <img
                        src={m.profiles?.avatar_url || avatarDataUri(m.profiles?.nickname ?? '玩')}
                        className="h-8 w-8 rounded-lg grayscale"
                        alt=""
                      />
                      <span className="text-sm font-bold line-through">
                        {m.profiles?.nickname}
                      </span>
                      <span className="ml-auto text-xs opacity-50">{roleLabel(m.role)}</span>
                    </div>
                  ))}
              </div>
            </>
          )}
          {winner && (
            <p className="mt-4 rounded-xl bg-emerald-500/10 p-3 text-center text-sm font-bold text-emerald-600 dark:text-emerald-300">
              🏁 本局胜方：
              {winner === 'civilian'
                ? '平民阵营'
                : winner === 'undercover'
                  ? '卧底阵营'
                  : '第三方'}
            </p>
          )}

          {/* 对局内聊天 */}
          <div className="mt-6 border-t border-black/5 pt-4 dark:border-white/10">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-black tracking-tight">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/15 to-violet-500/15 text-xs">
                💬
              </span>
              对局聊天
            </h2>
            <div className="h-44 space-y-1.5 overflow-y-auto pr-1">
              {messages.map((m) => (
                <p key={m.id} className="text-sm">
                  <b className="text-indigo-500 dark:text-indigo-300">{chatName(m.user_id)}</b>
                  <span className="ml-2 break-all">{m.content}</span>
                </p>
              ))}
              {messages.length === 0 && <p className="text-xs opacity-40">聊聊谁最可疑…</p>}
            </div>
            <div className="mt-3 space-y-2">
              <EmojiBar onSelect={(e) => sendChat(e)} />
              <BrutalInput
                placeholder="快捷聊天…"
                value={chatText}
                onChange={setChatText}
                onEnter={() => sendChat()}
                maxLength={60}
                full
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
