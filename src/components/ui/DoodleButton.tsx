import { cn } from '../../lib/utils'
import DashSpinLoader from './DashSpinLoader'

interface Props {
  children: React.ReactNode
  variant?: 'A' | 'B' | 'C'
  onClick?: () => void
  size?: 'md' | 'sm' | 'full'
  loading?: boolean
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit'
}

/** 统一 CTA 按钮：替代原涂鸦线按钮，保持 variant/size/loading 语义 */
export default function DoodleButton({
  children,
  variant = 'A',
  onClick,
  size = 'md',
  loading = false,
  disabled = false,
  className,
  type = 'button',
}: Props) {
  const tone =
    variant === 'C'
      ? 'bg-[var(--accent)] text-white border-transparent hover:opacity-90'
      : variant === 'B'
        ? 'bg-[var(--raised-2)] text-[var(--ink)] border-[var(--rule-2)] hover:bg-[var(--raised)]'
        : 'bg-[var(--ink)] text-[var(--bg)] border-[var(--ink)] hover:opacity-90'
  const dims =
    size === 'sm'
      ? 'px-3 py-1.5 text-small'
      : size === 'full'
        ? 'w-full px-4 py-2.5 text-body'
        : 'px-4 py-2.5 text-body'

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-card border font-semibold transition-all duration-150 disabled:pointer-events-none disabled:opacity-45',
        tone,
        dims,
        size === 'full' && 'w-full',
        className,
      )}
    >
      {loading && <DashSpinLoader size={14} color="currentColor" />}
      {children}
    </button>
  )
}
