import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { useToast } from '../hooks/useToast'
import { Btn, CardPair, Rule } from '../components/primitives'
import {
  IconMoon,
  IconSun,
  IconCards,
  IconClock,
  IconVote,
  IconUsers,
  IconBook,
  IconTrophy,
} from '../components/icons'
import { ROLE_DESC } from '../lib/game'

const MECHANICS = [
  { Icon: IconCards, title: '发词', desc: '按人数配好身份和词，人人有牌' },
  { Icon: IconClock, title: '计时', desc: '轮到谁讲、还剩几秒，全房间同步' },
  { Icon: IconVote, title: '投票', desc: '每人一票，实时统计谁最可疑' },
  { Icon: IconUsers, title: '判胜负', desc: '自动结算，平票加时，赛后复盘' },
]

const ROLES = ['undercover', 'white', 'detective', 'prophet', 'double', 'third_party'] as const

export default function Landing() {
  const { theme, toggle } = useTheme()
  const { session, signInAsGuest } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const dark = theme === 'dark'

  // 已登录就别停在首屏
  useEffect(() => {
    if (session) navigate('/home', { replace: true })
  }, [session, navigate])

  /** 一句话开局：没账号就先开游客身份，直接进建房 */
  const start = async () => {
    try {
      if (!session) await signInAsGuest()
      navigate('/rooms/create')
    } catch (e) {
      navigate('/login')
      toast((e as Error).message, 'error')
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* 顶栏 */}
      <header className="border-b border-[var(--rule)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5 md:px-8">
          <span className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-[5px] bg-[var(--danger)] text-[13px] font-bold text-white">
              卧
            </span>
            <span className="display text-body">谁是卧底</span>
          </span>

          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={toggle}
              aria-label={dark ? '切换到白桌（浅色）' : '切换到夜桌（深色）'}
              title={dark ? '白桌 · 浅色' : '夜桌 · 深色'}
              className="grid h-9 w-9 place-items-center rounded-card text-ink-2 transition-colors hover:bg-[var(--raised)] hover:text-[var(--ink)]"
            >
              {dark ? <IconSun size={19} /> : <IconMoon size={19} />}
            </button>
            <Link
              to="/login"
              className="rounded-card px-3 py-2 text-small font-semibold text-ink-2 transition-colors hover:bg-[var(--raised)] hover:text-[var(--ink)]"
            >
              登录
            </Link>
          </div>
        </div>
      </header>

      {/* Hero —— 记忆点是错位的两张牌，其余全部安静 */}
      <section className="mx-auto w-full max-w-6xl px-5 pb-16 pt-14 md:px-8 md:pb-24 md:pt-20">
        <div className="grid items-center gap-12 md:grid-cols-[auto_1fr] md:gap-16">
          <div className="deal shrink-0 justify-self-center md:justify-self-start">
            <CardPair top="白菜" bottom="白菜帮子" size="lg" />
          </div>

          <div className="settle" style={{ animationDelay: '.08s' }}>
            <h1 className="display text-hero">
              谁是卧底
            </h1>
            <p className="mt-6 max-w-measure text-lead muted">
              围坐一圈，人手一张牌。其中两张几乎一样 —— 那两张牌上的人，
              此刻正在听你描述自己的词。
            </p>
            <p className="mt-4 max-w-measure text-body muted">
              一台手机就能当裁判、记分员和气氛组：发词、计时、投票、判胜负，全都自动。
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Btn onClick={start} className="px-6 py-3">
                开一局
              </Btn>
              <Link
                to="/register"
                className="rounded-card border border-[var(--rule-2)] px-4 py-2.5 text-body font-semibold transition-colors hover:border-[var(--ink-3)] hover:bg-[var(--raised-2)]"
              >
                注册账号，保留战绩
              </Link>
            </div>
            <p className="mt-4 text-small faint">没有账号也能先玩，房间随时能退出。</p>
          </div>
        </div>
      </section>

      <Rule />

      {/* 一台手机顶四个岗 */}
      <section className="mx-auto w-full max-w-6xl px-5 py-14 md:px-8 md:py-16">
        <div className="grid gap-x-12 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
          {MECHANICS.map(({ Icon, title, desc }) => (
            <div key={title}>
              <Icon size={22} className="text-[var(--accent)]" />
              <h2 className="display mt-3.5 text-title">{title}</h2>
              <p className="mt-2 text-small muted">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <Rule />

      {/* 角色 / 词库 / 战绩 */}
      <section className="mx-auto grid w-full max-w-6xl gap-x-16 gap-y-12 px-5 py-14 md:grid-cols-2 md:px-8 md:py-16">
        <div>
          <h2 className="display text-title">角色自己配</h2>
          <p className="mt-2 max-w-measure text-small muted">
            经典局只有平民和卧底。想加花样，白板、侦探、预言家、双面人都能按人数塞进去。
          </p>
          <dl className="mt-6 divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
            {ROLES.map((r) => (
              <div key={r} className="flex gap-4 py-3">
                <dt className="w-14 shrink-0 text-small font-bold">
                  {r === 'undercover' ? '卧底' : r === 'white' ? '白板' : r === 'detective' ? '侦探' : r === 'prophet' ? '预言家' : r === 'double' ? '双面人' : '第三方'}
                </dt>
                <dd className="min-w-0 flex-1 text-small muted">{ROLE_DESC[r]}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <h2 className="display text-title">词不够用？自己建</h2>
          <p className="mt-2 max-w-measure text-small muted">
            词库按分类和难度抽词。觉得内置的不好笑，导入一套自己的，房间创建时直接选。
          </p>
          <dl className="mt-6 divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
            {[
              { Icon: IconBook, t: '系统词库', d: '开箱即用，按难度分级' },
              { Icon: IconUsers, t: '社区词库', d: '其他玩家公开分享的' },
              { Icon: IconTrophy, t: '自建词库', d: '自己录入，可导出 JSON' },
            ].map(({ Icon, t, d }) => (
              <div key={t} className="flex items-start gap-4 py-3.5">
                <Icon size={19} className="mt-0.5 shrink-0 text-ink-3" />
                <div className="min-w-0">
                  <dt className="text-small font-bold">{t}</dt>
                  <dd className="mt-0.5 text-small muted">{d}</dd>
                </div>
              </div>
            ))}
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/word-packs"
              className="rounded-card border border-[var(--rule-2)] px-4 py-2.5 text-small font-semibold transition-colors hover:border-[var(--ink-3)] hover:bg-[var(--raised-2)]"
            >
              逛逛词库
            </Link>
            <Link
              to="/friends"
              className="rounded-card border border-[var(--rule-2)] px-4 py-2.5 text-small font-semibold transition-colors hover:border-[var(--ink-3)] hover:bg-[var(--raised-2)]"
            >
              叫上好友
            </Link>
          </div>
        </div>
      </section>

      <footer className="mt-auto border-t border-[var(--rule)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-8 text-small faint md:px-8">
          <span>谁是卧底 · 派对主持系统</span>
          <span className="tnum">React · Vite · Nhost</span>
          <Link to="/login" className="ml-auto underline underline-offset-4 hover:text-[var(--ink)]">
            登录已有账号
          </Link>
        </div>
      </footer>
    </div>
  )
}
