import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { PageHeader } from '../components/Layout'
import { BrutalInput, WifiLoader, Cards, MaterialSwitch, DoodleButton, UserProfileButton } from '../components/ui'
import { searchUsers, sendFriendRequest, listFriendProfiles, updateProfile } from '../lib/api'
import { avatarDataUri } from '../lib/utils'
import type { Profile } from '../types/db'

/** 搜索好友：新粗野输入框 + WiFi 加载器 + 在线状态开关 */
export default function FriendSearch() {
  const { profile: me, refreshProfile } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState<Profile[]>([])
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set())
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)

  const doSearch = async (kw: string) => {
    setKeyword(kw)
    if (!kw.trim()) {
      setResults([])
      setSearched(false)
      return
    }
    setSearching(true)
    setSearched(true)
    try {
      const [list, friends] = await Promise.all([searchUsers(kw), listFriendProfiles()])
      setResults(list.filter((u) => u.id !== me?.id))
      setFriendIds(new Set(friends.map((f) => f.id)))
    } catch (e) {
      toast((e as Error).message, 'error')
    } finally {
      setSearching(false)
    }
  }

  const add = async (id: string, nickname: string) => {
    try {
      await sendFriendRequest(id, `你好，我是${me?.nickname ?? '玩家'}`)
      setFriendIds((s) => new Set(s).add(id))
      toast(`已向 ${nickname} 发送好友申请`, 'success')
    } catch (e) {
      toast((e as Error).message, 'error')
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader back title="搜索好友" sub="按昵称 / 用户 ID 搜索" />

      <section className="panel p-5">
        <div className="flex flex-wrap items-center gap-4">
          <BrutalInput
            placeholder="输入昵称或 ID…"
            value={keyword}
            onChange={doSearch}
            onEnter={() => doSearch(keyword)}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
            }
          />
          {/* 是否显示在线状态 */}
          <MaterialSwitch
            checked={(me?.show_online ?? true) !== false}
            onChange={async (v) => {
              if (!me) return
              await updateProfile(me.id, { show_online: v })
              await refreshProfile()
              toast(v ? '已开启在线状态显示' : '已隐身', 'info')
            }}
            label="显示我的在线状态"
          />
        </div>

        {searching && (
          <div className="flex flex-col items-center py-8">
            <WifiLoader text="匹配用户中…" scale={0.4} />
          </div>
        )}

        {!searching && searched && results.length === 0 && (
          <p className="py-8 text-center text-sm muted">没有找到匹配的用户</p>
        )}

        {!searching && results.length > 0 && (
          <div className="mt-5 space-y-2">
            {results.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-3 rounded-xl border border-black/5 bg-black/[0.02] p-3 dark:border-white/10 dark:bg-white/5"
              >
                <UserProfileButton
                  size="sm"
                  avatarUrl={u.avatar_url || avatarDataUri(u.nickname)}
                  onClick={() => navigate(`/profile/${u.id}`)}
                />
                <div className="flex-1">
                  <p className="text-sm font-bold">{u.nickname}</p>
                  <p className="text-xs muted">
                    Lv.{u.level} · ID: {u.id.slice(0, 8)}
                  </p>
                </div>
                {friendIds.has(u.id) ? (
                  <span className="chip bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">已是好友</span>
                ) : (
                  <DoodleButton variant="A" size="sm" onClick={() => add(u.id, u.nickname)}>
                    加好友
                  </DoodleButton>
                )}
              </div>
            ))}
          </div>
        )}

        {!searching && !searched && (
          <div className="mt-6">
            <Cards
              items={[
                { key: 'tip1', title: '试试搜索昵称', subtitle: '支持模糊匹配', color: 'blue', icon: '🔍' },
                { key: 'tip2', title: '或搜索用户 ID', subtitle: '资料页可查看完整 ID', color: 'green', icon: '🆔' },
              ]}
            />
          </div>
        )}
      </section>
    </div>
  )
}
