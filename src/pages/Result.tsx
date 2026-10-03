import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { PageHeader, EmptyState } from '../components/Layout'
import {
  LuxuryCard,
  FolderCard,
  Cards,
  EmojiBar,
  DoodleButton,
  TakeOffButton,
  StrokeCheckbox,
} from '../components/ui'
import { getRoomByCode, getGame, getGamePlayers, listMembers, updateRoomSettings } from '../lib/api'
import { supabase } from '../lib/supabase'
import { roleLabel } from '../lib/game'
import { avatarDataUri, cn, copyText } from '../lib/utils'
import type { Game, GamePlayer, RoomMember, VoteRow } from '../types/db'

const WINNER_LABEL: Record<string, { text: string; icon: string; color: string }> = {
  civilian: { text: '平民阵营获胜！', icon: '🎉', color: 'emerald' },
  undercover: { text: '卧底阵营获胜！', icon: '🕵️', color: 'rose' },
  third_party: { text: '第三方获胜！', icon: '👤', color: 'amber' },
}

export default function Result() {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const { profile: me } = useAuth()
  const { toast } = useToast()
  const [room, setRoom] = useState<Awaited<ReturnType<typeof getRoomByCode>>>(null)
  const [members, setMembers] = useState<RoomMember[]>([])
  const [game, setGame] = useState<Game | null>(null)
  const [players, setPlayers] = useState<GamePlayer[]>([])
  const [votes, setVotes] = useState<VoteRow[]>([])
  const [saved, setSaved] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      const r = await getRoomByCode(code)
      if (!r || !alive) return setLoading(false)
      setRoom(r)
      const [ms, g] = await Promise.all([listMembers(r.id), getGame(r.id)])
      setMembers(ms)
      setGame(g)
      if (g) {
        const [gp, vs] = await Promise.all([
          getGamePlayers(g.id),
          supabase.from('votes').select('*').eq('room_id', r.id).order('round'),
        ])
        setPlayers(gp)
        setVotes((vs.data as VoteRow[]) ?? [])
      }
      setLoading(false)
    })()
    return () => {
      alive = false
    }
  }, [code])

  const rounds = useMemo(() => {
    const map = new Map<number, VoteRow[]>()
    votes.forEach((v) => {
      const arr = map.get(v.round) ?? []
      arr.push(v)
      map.set(v.round, arr)
    })
    return [...map.entries()].sort((a, b) => a[0] - b[0])
  }, [votes])

  const nameOf = (uid: string) =>
    players.find((p) => p.user_id === uid)?.profiles?.nickname ||
    members.find((m) => m.user_id === uid)?.profiles?.nickname ||
    '玩家'

  const reviewOn = room?.settings?.enable_review ?? true
  const winner = game?.winner

  const mvp = useMemo(() => {
    if (players.length === 0) return null
    const winnerSide = players.filter((p) =>
      winner === 'undercover'
        ? p.role === 'undercover'
        : winner === 'third_party'
          ? p.role === 'third_party'
          : p.role !== 'undercover' && p.role !== 'third_party',
    )
    const pool = winnerSide.length ? winnerSide : players
    return [...pool].sort((a, b) => (b.votes_received ?? 0) - (a.votes_received ?? 0))[0]
  }, [players, winner])

  const restart = async () => {
    if (!room) return
    if (room.host_id !== me?.id) {
      toast('等待房主开启下一局', 'info')
      navigate(`/rooms/${code}`)
      return
    }
    await updateRoomSettings(room.id, {
      ...room.settings,
      game_phase: undefined,
      round: undefined,
      current_speaker: null,
      phase_ends_at: null,
      speak_order_ids: undefined,
    })
    await supabase
      .from('room_members')
      .update({ is_ready: false, is_alive: true, role: null, word: null })
      .eq('room_id', room.id)
    await supabase.from('rooms').update({ status: 'waiting' }).eq('id', room.id)
    toast('已重置房间，等待准备', 'success')
    navigate(`/rooms/${code}`)
  }

  const share = async () => {
    const lines = players.map(
      (p) =>
        `${p.profiles?.nickname}: ${roleLabel(p.role)}（${p.word ?? '白板'}）${p.is_winner ? ' 🏅' : ''}`,
    )
    const text = `【谁是卧底 · 房间 ${code}】${game?.winner ? WINNER_LABEL[game.winner].text : ''}\n${lines.join(
      '\n',
    )}`
    if (await copyText(text)) toast('战绩已复制，去分享吧', 'success')
    else toast('复制失败', 'error')
  }

  if (loading) return <EmptyState text="结算中…" />
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

  const winnerInfo = winner ? WINNER_LABEL[winner] : null

  return (
    <div className="space-y-6">
      <PageHeader
        title="本局结算"
        sub={`房间 ${code} · ${game?.ended_at ? new Date(game.ended_at).toLocaleString() : ''}`}
        right={
          <StrokeCheckbox
            checked={saved}
            onChange={setSaved}
            label="保存到我的战绩"
            disabled
          />
        }
      />

      {/* 胜负横幅 */}
      <section
        className="glass-card relative overflow-hidden p-8 text-center"
        style={{ animation: 'scaleIn 0.6s cubic-bezier(0.22,1,0.36,1) both' }}
      >
        <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 -bottom-16 h-48 w-48 rounded-full bg-violet-500/15 blur-3xl" />

        <p className="text-5xl" style={{ animation: 'float 3s ease-in-out infinite' }}>
          {winnerInfo?.icon ?? '🏁'}
        </p>
        <h1 className="mt-4 text-3xl font-black tracking-tight">
          {winnerInfo?.text ?? '对局结束'}
        </h1>
        <p className="mt-2 text-sm opacity-50">
          存活 {members.filter((m) => m.is_alive).length} 人 · 共 {rounds.length} 轮投票
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
          <DoodleButton variant="C" onClick={restart}>
            再来一局
          </DoodleButton>
          <TakeOffButton compact label="分享战绩" sentLabel="已分享" onAction={share} />
        </div>

        <div className="mt-6 flex justify-center">
          <EmojiBar onSelect={(e) => toast(`给了本局一个 ${e}`, 'success')} />
        </div>
      </section>

      {/* MVP 奢华卡 */}
      {mvp && (
        <section
          className="glass-card flex flex-wrap items-center justify-around gap-6 p-6"
          style={{ animation: 'fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) .15s both' }}
        >
          <LuxuryCard value={mvp.profiles?.nickname ?? '玩家'} footer="mvp" caption="本局 MVP" />
          <LuxuryCard
            value={roleLabel(mvp.role)}
            footer="role"
            caption={winner === 'undercover' ? '最佳卧底' : winner === 'third_party' ? '最佳第三方' : '关键平民'}
          />
          <LuxuryCard value={`${mvp.votes_received ?? 0} 票`} footer="votes" caption="累计得票" />
        </section>
      )}

      <div
        className="grid gap-4 lg:grid-cols-2"
        style={{ animation: 'fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) .3s both' }}
      >
        {/* 每轮投票详情 */}
        {reviewOn && (
          <section className="glass-card p-6">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-black tracking-tight">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/15 to-violet-500/15 text-xs">
                🗂️
              </span>
              逐轮投票复盘
            </h2>
            <p className="mb-4 text-xs opacity-40">点开卡片查看每一轮的投票明细</p>
            <div className="flex flex-wrap items-start gap-6">
              {rounds.map(([r, vs]) => (
                <FolderCard
                  key={r}
                  name={`第 ${r} 轮`}
                  count={vs.length}
                  files={vs.map((v) => ({
                    text: `${nameOf(v.voter_id)} → ${nameOf(v.target_id)}`,
                    tag: '票',
                  }))}
                />
              ))}
              {rounds.length === 0 && <p className="text-sm opacity-40">本局没有投票记录</p>}
            </div>
          </section>
        )}

        {/* 玩家战绩 */}
        <section className="glass-card p-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-black tracking-tight">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/15 to-violet-500/15 text-xs">
              🎖️
            </span>
            玩家战绩
          </h2>
          <Cards
            className="md:flex-row md:flex-wrap"
            items={players.map((p) => ({
              key: p.id,
              title: `${p.profiles?.nickname ?? '玩家'} · ${roleLabel(p.role)}`,
              subtitle: `词：${p.word ?? '白板（无词）'} · 得票 ${p.votes_received ?? 0}`,
              color: p.is_winner ? 'green' : p.role === 'undercover' ? 'red' : 'blue',
              icon: (
                <img
                  src={p.profiles?.avatar_url || avatarDataUri(p.profiles?.nickname ?? '玩')}
                  className="h-5 w-5 rounded-full"
                  alt=""
                />
              ),
              badge: p.is_winner ? '获胜' : undefined,
              onClick: () => navigate(`/profile/${p.user_id}`),
            }))}
          />
          {players.length === 0 && <p className="text-sm opacity-40">暂无战绩数据</p>}
        </section>
      </div>

      {/* 上帝视角 */}
      {reviewOn && (
        <section
          className="glass-card p-6"
          style={{ animation: 'fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) .45s both' }}
        >
          <h2 className="mb-4 flex items-center gap-2 text-sm font-black tracking-tight">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/15 to-violet-500/15 text-xs">
              👁️
            </span>
            上帝视角 · 全员身份
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs opacity-40">
                  <th className="pb-2 font-bold">玩家</th>
                  <th className="pb-2 font-bold">身份</th>
                  <th className="pb-2 font-bold">词</th>
                  <th className="pb-2 font-bold">得票</th>
                  <th className="pb-2 font-bold">结果</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p) => (
                  <tr key={p.id} className="border-t border-black/5 dark:border-white/10">
                    <td className="py-2.5 font-bold">{p.profiles?.nickname ?? '玩家'}</td>
                    <td className="py-2.5">{roleLabel(p.role)}</td>
                    <td className="py-2.5">{p.word ?? '—'}</td>
                    <td className="py-2.5">{p.votes_received ?? 0}</td>
                    <td
                      className={cn(
                        'py-2.5 font-bold',
                        p.is_winner ? 'text-emerald-500 dark:text-emerald-300' : 'opacity-40',
                      )}
                    >
                      {p.is_winner ? '获胜' : '落败'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
