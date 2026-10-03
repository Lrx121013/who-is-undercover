import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { PageHeader, EmptyState } from '../components/Layout'
import {
  LuxuryCard,
  Cards,
  DoodleButton,
  UserProfileButton,
  PerCharInput,
  FloatingInput,
  TakeOffButton,
} from '../components/ui'
import { getProfile, updateProfile, uploadAvatar, sendFriendRequest, blockUser, unfriend, myGameStats, recentGames } from '../lib/api'
import type { RecentGame } from '../lib/api'
import { expToLevel, avatarDataUri, validateAvatarFile, cn, formatTime } from '../lib/utils'
import { roleLabel } from '../lib/game'
import AvatarPicker from '../components/AvatarPicker'
import type { Profile } from '../types/db'

export default function Profile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile: me, refreshProfile } = useAuth()
  const { toast } = useToast()
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [stats, setStats] = useState({ total: 0, wins: 0, undercover: 0, undercoverWins: 0, votes: 0 })
  const [history, setHistory] = useState<RecentGame[]>([])

  // 编辑表单
  const [nickname, setNickname] = useState('')
  const [bio, setBio] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarValue, setAvatarValue] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let alive = true
    const uid = id || me?.id
    if (!uid) return
    getProfile(uid).then(async (p) => {
      if (!alive) return
      setUser(p)
      setLoading(false)
      setNickname(p?.nickname ?? '')
      setBio(p?.bio ?? '')
      const s = await myGameStats(uid)
      const h = await recentGames(uid)
      if (alive) {
        setStats(s)
        setHistory(h)
      }
    })
    return () => {
      alive = false
    }
  }, [id, me?.id])

  const isMe = me?.id === user?.id

  const openEditor = () => {
    if (!user) return
    setNickname(user.nickname)
    setBio(user.bio ?? '')
    setAvatarFile(null)
    setAvatarPreview(null)
    setAvatarValue(user.avatar_url)
    setEditing(true)
  }

  const dropPreview = () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
  }

  const pickFile = (file: File) => {
    const invalid = validateAvatarFile(file)
    if (invalid) return toast(invalid, 'error')
    dropPreview()
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const pickPreset = (url: string) => {
    dropPreview()
    setAvatarFile(null)
    setAvatarPreview(null)
    setAvatarValue(url)
  }

  const clearAvatar = () => {
    dropPreview()
    setAvatarFile(null)
    setAvatarPreview(null)
    setAvatarValue(null)
  }

  const save = async () => {
    if (!me || !user) return
    setSaving(true)
    try {
      let avatar_url = avatarValue
      if (avatarFile) avatar_url = await uploadAvatar(me.id, avatarFile)
      await updateProfile(me.id, {
        nickname: nickname.trim() || user.nickname,
        bio: bio.trim(),
        avatar_url,
      })
      await refreshProfile()
      setUser({ ...user, nickname: nickname.trim() || user.nickname, bio: bio.trim(), avatar_url })
      setEditing(false)
      dropPreview()
      setAvatarFile(null)
      toast('资料已保存', 'success')
    } catch (e) {
      toast((e as Error).message, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <EmptyState text="加载资料中…" />
  if (!user) return <EmptyState text="用户不存在" action={<DoodleButton variant="B" size="sm" onClick={() => navigate('/home')}>回首页</DoodleButton>} />

  const level = expToLevel(user.exp)
  const winRate = user.total_games > 0 ? Math.round((user.win_count / user.total_games) * 100) : 0

  return (
    <div className="space-y-6">
      <PageHeader back title={user.nickname} sub={`ID: ${user.id.slice(0, 8)} · Lv.${level}`} />

      <div className="panel flex flex-wrap items-center gap-5 p-6">
        <img
          src={user.avatar_url || avatarDataUri(user.nickname)}
          alt=""
          className="h-20 w-20 rounded-2xl object-cover shadow-lg"
        />
        <div className="flex-1">
          <h2 className="text-2xl font-black">{user.nickname}</h2>
          <p className="mt-1 text-sm muted">{user.bio || '这个人很懒，什么都没写'}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="chip bg-brand-500/15 text-brand-600 dark:text-brand-300">Lv.{level}</span>
            <span className="chip bg-blue-500/15 text-blue-600 dark:text-blue-300">
              总场次 {user.total_games}
            </span>
            <span className="chip bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
              胜率 {winRate}%
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <UserProfileButton
            size="sm"
            name=""
            avatarUrl={user.avatar_url || avatarDataUri(user.nickname)}
            onClick={() => isMe && openEditor()}
          />
          {isMe ? (
            <DoodleButton variant="A" size="sm" onClick={openEditor}>
              编辑资料
            </DoodleButton>
          ) : (
            <>
              <DoodleButton
                variant="C"
                size="sm"
                onClick={async () => {
                  try {
                    await sendFriendRequest(user.id)
                    toast('好友申请已发送', 'success')
                  } catch (e) {
                    toast((e as Error).message, 'error')
                  }
                }}
              >
                加好友
              </DoodleButton>
              <DoodleButton
                variant="B"
                size="sm"
                onClick={async () => {
                  await unfriend(user.id)
                  toast('已解除好友关系', 'info')
                }}
              >
                删好友
              </DoodleButton>
              <button
                onClick={async () => {
                  await blockUser(user.id)
                  toast('已拉黑', 'info')
                }}
                className="text-xs font-bold text-rose-500 hover:underline"
              >
                拉黑
              </button>
            </>
          )}
        </div>
      </div>

      {/* 荣誉 */}
      <section className="panel flex flex-wrap items-center justify-around gap-4 p-5">
        <LuxuryCard value={`Lv.${level}`} footer="level" caption="段位" />
        <LuxuryCard value={`${stats.undercoverWins}/${stats.undercover}`} footer="undercover" caption="卧底胜场" />
        <LuxuryCard value={`${stats.votes}`} footer="votes" caption="累计得票" />
      </section>

      {/* 战绩 */}
      <section className="panel p-5">
        <h2 className="section-title">📊 生涯数据</h2>
        <Cards
          className="md:flex-row md:flex-wrap"
          items={[
            { key: 't', title: `总场次 ${stats.total}`, color: 'blue', icon: '🎮' },
            { key: 'w', title: `获胜 ${stats.wins}`, color: 'green', icon: '🏅' },
            { key: 'u', title: `卧底局 ${stats.undercover}`, color: 'red', icon: '🕵️' },
            { key: 'v', title: `得票 ${stats.votes}`, color: 'amber', icon: '🗳️' },
          ]}
        />
      </section>

      {/* 最近对局 */}
      {history.length > 0 && (
        <section className="panel p-5">
          <h2 className="section-title">🕹️ 最近对局</h2>
          <div className="space-y-2">
            {history.map((g) => (
              <div
                key={g.id}
                className={cn(
                  'flex items-center gap-3 rounded-xl border p-3',
                  g.is_winner
                    ? 'border-emerald-400/40 bg-emerald-500/5'
                    : 'border-black/5 dark:border-white/10',
                )}
              >
                <span className="text-xl">{g.is_winner ? '🏅' : '💀'}</span>
                <div className="flex-1">
                  <p className="text-sm font-bold">
                    {roleLabel(g.role)}
                    {g.word ? ` · 词：${g.word}` : ''}
                  </p>
                  <p className="text-xs muted">
                    {g.games?.ended_at ? formatTime(g.games.ended_at) : '—'} · 得票{' '}
                    {g.votes_received ?? 0}
                  </p>
                </div>
                <span className={cn('text-xs font-bold', g.is_winner ? 'text-emerald-500' : 'muted')}>
                  {g.is_winner ? '获胜' : '落败'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 编辑资料 */}
      {editing && isMe && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="panel w-full max-w-sm bg-white p-6 dark:bg-ink-700">
            <h3 className="text-lg font-black">编辑资料</h3>
            <div className="mt-5 space-y-6">
              <PerCharInput label="昵称" value={nickname} onChange={setNickname} full maxLength={12} />
              <FloatingInput label="个性签名" value={bio} onChange={setBio} full maxLength={40} required={false} />
              <AvatarPicker
                preview={avatarPreview || avatarValue || avatarDataUri(nickname)}
                customized={Boolean(avatarPreview || avatarValue)}
                onFile={pickFile}
                onPreset={pickPreset}
                onClear={clearAvatar}
                uploading={saving}
              />
            </div>
            <div className="mt-7 flex items-center justify-between">
              <TakeOffButton
                compact
                label="保存并同步云端"
                sentLabel="已同步"
                disabled={saving}
                onAction={save}
              />
              <DoodleButton variant="B" size="sm" onClick={() => setEditing(false)}>
                取消
              </DoodleButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
