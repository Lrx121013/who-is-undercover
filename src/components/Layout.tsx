import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { useToast } from '../hooks/useToast'
import { listNotifications, subscribe } from '../lib/api'
import { cn, avatarDataUri } from '../lib/utils'
import { Btn, Empty, Spinner } from './primitives'
import {
  IconHome,
  IconRooms,
  IconFriends,
  IconBook,
  IconTrophy,
  IconMedal,
  IconSettings,
  IconBell,
  IconMoon,
  IconSun,
  IconLogout,
  IconArrowLeft,
} from './icons'

const NAV = [
  { to: '/home', label: '首页', Icon: IconHome },
  { to: '/rooms', label: '房间', Icon: IconRooms },
  { to: '/friends', label: '好友', Icon: IconFriends },
  { to: '/word-packs', label: '词库', Icon: IconBook },
  { to: '/leaderboard', label: '排行', Icon: IconTrophy },
  { to: '/achievements', label: '成就', Icon: IconMedal },
  { to: '/settings', label: '设置', Icon: IconSettings },
]

/** 未读通知数：优先走 Realtime，30s 轮询兜底 */
function Bell() {
  const { session } = useAuth()
  const uid = session?.user?.id
  const [unread, setUnread] = useState<number | null>(null)

  const load = useCallback(async () => {
    if (!uid) return
    try {
      const rows = await listNotifications()
      setUnread(rows.filter((r) => !r.is_read && r.user_id === uid).length)
    } catch {
      // 后端不可达时不要一直转圈
      setUnread(0)
    }
  }, [uid])

  useEffect(() => {
    if (!uid) return
    void load()
    const un = subscribe('notify', 'notifications', `user_id=eq.${uid}`, () => void load())
    const t = window.setInterval(() => void load(), 30000)
    return () => {
      un()
      window.clearInterval(t)
    }
  }, [uid, load])

  return (
    <Link
      to="/notifications"
      aria-label={`通知中心${unread ? `，${unread} 条未读` : ''}`}
      className="relative grid h-9 w-9 place-items-center rounded-card text-ink-2 transition-colors hover:bg-[var(--raised)] hover:text-[var(--ink)]"
    >
      <IconBell size={19} />
      {unread ? <span className="badge-dot">{unread > 99 ? '99+' : unread}</span> : null}
    </Link>
  )
}

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  return (
    <button
      onClick={toggle}
      aria-label={dark ? '切换到白桌（浅色）' : '切换到夜桌（深色）'}
      title={dark ? '白桌 · 浅色' : '夜桌 · 深色'}
      className="grid h-9 w-9 place-items-center rounded-card text-ink-2 transition-colors hover:bg-[var(--raised)] hover:text-[var(--ink)]"
    >
      {dark ? <IconSun size={19} /> : <IconMoon size={19} />}
    </button>
  )
}

export default function Layout() {
  const { profile, isGuest, signOut } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const signOutAndGo = async () => {
    await signOut()
    toast('已退出登录')
    navigate('/')
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* 顶栏：扁平板 + 一根发丝线，不是一颗玻璃药丸 */}
      <header className="sticky top-0 z-40 border-b border-[var(--rule)] bg-[var(--bg)]/92 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-5 px-4 md:px-6">
          <Link to="/home" className="flex shrink-0 items-center gap-2.5" aria-label="返回首页">
            <span className="grid h-7 w-7 place-items-center rounded-[5px] bg-[var(--danger)] text-[13px] font-bold text-white">
              卧
            </span>
            <span className="display text-body tracking-tight">谁是卧底</span>
          </Link>

          <nav className="hidden flex-1 items-center gap-5 md:flex">
            {NAV.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => cn('nav-link flex items-center gap-1.5', isActive && 'nav-link-active')}
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            {isGuest && (
              <span className="mr-1 hidden rounded-full border border-[var(--accent)] px-2 py-0.5 text-micro font-semibold text-[var(--accent)] sm:block">
                游客
              </span>
            )}
            <ThemeToggle />
            <Bell />
            <button
              onClick={() => navigate(`/profile/${profile?.id ?? ''}`)}
              className="ml-0.5 grid h-8 w-8 place-items-center overflow-hidden rounded-full border border-[var(--rule-2)] transition hover:border-[var(--ink-3)]"
              aria-label="我的资料"
            >
              <img
                src={profile?.avatar_url || avatarDataUri(profile?.nickname || '我')}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
            <button
              onClick={signOutAndGo}
              aria-label="退出登录"
              title="退出登录"
              className="hidden h-9 w-9 place-items-center rounded-card text-ink-3 transition-colors hover:bg-[var(--raised)] hover:text-[var(--danger)] sm:grid"
            >
              <IconLogout size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-7 md:px-6 md:pb-14">
        <Outlet key={location.pathname} />
      </main>

      {/* 移动端底栏 */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--rule)] bg-[var(--bg)]/96 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        <div className="flex items-stretch">
          {NAV.slice(0, 5).map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors',
                  isActive ? 'text-[var(--ink)]' : 'text-[var(--ink-3)]',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} />
                  <span>{label}</span>
                  <span
                    className={cn(
                      'h-[2px] w-6 rounded-full transition-colors',
                      isActive ? 'bg-[var(--accent)]' : 'bg-transparent',
                    )}
                  />
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

/* ------------------------------------------------------------------
 * 页面骨架
 * ------------------------------------------------------------------ */

export function PageHeader({
  title,
  sub,
  right,
  back,
}: {
  title: string
  sub?: ReactNode
  right?: ReactNode
  back?: boolean | (() => void)
}) {
  const navigate = useNavigate()
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-[var(--rule)] pb-5">
      <div className="flex min-w-0 items-start gap-3">
        {(back === true || typeof back === 'function') && (
          <button
            onClick={() => (typeof back === 'function' ? back() : navigate(-1))}
            aria-label="返回"
            className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-card border border-[var(--rule)] text-ink-2 transition-colors hover:border-[var(--rule-2)] hover:text-[var(--ink)]"
          >
            <IconArrowLeft size={17} />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="display text-display">{title}</h1>
          {sub && <p className="mt-1.5 max-w-measure text-small muted">{sub}</p>}
        </div>
      </div>
      {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
    </div>
  )
}

/** 旧调用点仍在用 EmptyState，保留为薄封装 */
export function EmptyState({ text, action }: { text: string; action?: ReactNode }) {
  return <Empty title={text} action={action ?? <Btn tone="outline" size="sm" onClick={() => window.history.back()}>返回上一页</Btn>} />
}

/** 加载态：一条安静的骨架线 */
export function Loading({ label = '加载中' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2.5 py-10 text-small faint">
      <Spinner size={15} />
      {label}
    </div>
  )
}
