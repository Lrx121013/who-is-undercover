import { cn } from '../lib/utils'
import DashSpinLoader from './ui/DashSpinLoader'

function MicrosoftLogo() {
  return (
    <svg viewBox="0 0 23 23" className="h-[18px] w-[18px]" aria-hidden="true">
      <path fill="#f25022" d="M1 1h10v10H1z" />
      <path fill="#7fba00" d="M12 1h10v10H12z" />
      <path fill="#00a4ef" d="M1 12h10v10H1z" />
      <path fill="#ffb900" d="M12 12h10v10H12z" />
    </svg>
  )
}

interface Props {
  onClick: () => void
  loading?: boolean
  label?: string
  className?: string
}

/** 使用 Microsoft 账号登录（Supabase Azure OAuth） */
export default function MicrosoftButton({
  onClick,
  loading = false,
  label = '使用 Microsoft 登录',
  className,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={cn(
        'flex w-full items-center justify-center gap-3 rounded-xl border border-black/15 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/15 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10',
        className,
      )}
    >
      {loading ? <DashSpinLoader size={16} color="#0078d4" /> : <MicrosoftLogo />}
      <span>{loading ? '正在跳转…' : label}</span>
    </button>
  )
}