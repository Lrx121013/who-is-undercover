import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { useToast } from '../hooks/useToast'
import { listNotifications, subscribe } from '../lib/api'
import { cn, avatarDataUri } from '../lib/utils'
import {
  ThemeSwitch,
  UserProfileButton,
  DoodleButton,
} from './ui'

const NAV = [
  { to: '/home', label: '首页', icon: '🏠' },
  { to: '/rooms', label: '房间', icon: '🎮' },
  { to: '/friends', label: '好友', icon: '🤝' },
  { to: '/word-packs', label: '词库', icon: '📚' },
  { to: '/leaderboard', label: '排行', icon: '🏆' },
  { to: '/achievements', label: '成就', icon: '🎖️' },
  { to: '/settings', label: '设置', icon: '⚙️' },
]

function Bell() {
  const { session } = useAuth()
  const uid = session?.user?.id
  const [unread, setUnread] = useState(0)

  const load = async () => {
    if (!uid) return
    const rows = await listNotifications()
    setUnread(rows.filter((r) => !r.is_read && r.user_id === uid).length)
  }

  useEffect(() => {
    void load()
    if (!uid) return
    const un = subscribe('notify', 'notifications', `user_id=eq.${uid}`, () => void load())
    const t = window.setInterval(load, 15000)
    return () => {
      un()
      window.clearInterval(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid])

  return (
    <NavLink
      to="/notifications"
      className="relative grid h-10 w-10 place-items-center rounded-xl transition hover:bg-black/5 dark:hover:bg-white/10"
      title="通知中心"
    >
      <span className="text-lg">🔔</span>
      {unread > 0 && <span className="badge-dot">{unread > 99 ? '99+' : unread}</span>}
    </NavLink>
  )
}

export default function Layout() {
  const { profile, isGuest, signOut } = useAuth()
  const { theme, toggle } = useTheme()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    await signOut()
    toast('已退出登录', 'info')
    navigate('/')
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      {/* 顶栏 */}
      <header className="sticky top-0 z-40">
        <div className="glass-card mx-auto mt-3 flex h-14 max-w-6xl items-center gap-2 rounded-2xl border border-black/5 bg-white/60 px-4 dark:border-white/10 dark:bg-ink-900/60 md:mx-auto md:px-5">
          <NavLink to="/home" className="flex shrink-0 items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-base shadow-lg shadow-indigo-500/20">
              🕵️
            </span>
            <span className="hidden text-sm font-black tracking-tight lg:block">
              谁是卧底<span className="gradient-text">出题器</span>
            </span>
          </NavLink>

          {/* 桌面端导航 */}
          <nav className="ml-2 hidden flex-1 items-center gap-0.5 md:flex">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) => cn('nav-link', isActive && 'nav-link-active')}
              >
                <span className="mr-1 text-xs">{n.icon}</span>
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <ThemeSwitch checked={theme === 'dark'} onChange={toggle} />
            <Bell />
            <UserProfileButton
              name={profile?.nickname || '我的'}
              avatarUrl={profile?.avatar_url || avatarDataUri(profile?.nickname || '我')}
              onClick={() => navigate(`/profile/${profile?.id ?? ''}`)}
            />
            {isGuest && (
              <span className="hidden rounded-full bg-amber-400/20 px-2.5 py-1 text-[10px] font-black text-amber-600 dark:text-amber-300 sm:block">
                游客
              </span>
            )}
            <button
              onClick={handleSignOut}
              className="hidden rounded-xl px-3 py-2 text-xs font-bold opacity-50 transition hover:opacity-90 sm:block"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      {/* 主区域 */}
      <main key={location.pathname} className="fade-up mx-auto max-w-6xl px-4 py-6 md:py-8">
        <Outlet />
      </main>

      {/* 移动端底部导航 */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-black/5 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-ink-900/90 md:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-around px-2 py-2">
          {NAV.slice(0, 5).map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center rounded-xl px-3 py-1.5 text-[10px] font-bold transition-all duration-200',
                  isActive
                    ? 'bg-indigo-500/12 text-indigo-500 dark:bg-indigo-400/15 dark:text-indigo-300'
                    : 'opacity-50',
                )
              }
            >
              <span className="text-lg">{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

/** 页面通用头部：标题 + 右侧操作区 */
export function PageHeader({
  title,
  sub,
  right,
  back,
}: {
  title: string
  sub?: string
  right?: React.ReactNode
  back?: boolean
}) {
  const navigate = useNavigate()
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      {back && (
        <button
          onClick={() => navigate(-1)}
          className="grid h-10 w-10 place-items-center rounded-xl border border-black/8 bg-white/50 text-lg transition hover:bg-black/5 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
          aria-label="返回"
        >
          ←
        </button>
      )}
      <div className="flex-1">
        <h1 className="text-xl font-black tracking-tight md:text-2xl">{title}</h1>
        {sub && <p className="mt-0.5 text-sm opacity-50">{sub}</p>}
      </div>
      {right}
    </div>
  )
}

/** 空状态 */
export function EmptyState({ text, action }: { text: string; action?: React.ReactNode }) {
  return (
    <div className="panel flex flex-col items-center gap-4 px-6 py-14 text-center">
      <span className="text-4xl opacity-60">🗒️</span>
      <p className="text-sm opacity-50">{text}</p>
      {action ?? (
        <DoodleButton variant="B" size="sm" onClick={() => window.history.back()}>
          返回上一页
        </DoodleButton>
      )}
    </div>
  )
}
