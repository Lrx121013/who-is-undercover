import type { ReactNode } from 'react'
import { cn } from '../lib/utils'

/* ==================================================================
 * 版面原语
 *
 * 层级靠发丝线和墨色浓淡表达；只有真正代表实体物件的东西
 * （词牌、印章）才允许有材质、圆角和阴影。
 * ================================================================== */

/** 分隔线 */
export function Rule({ className }: { className?: string }) {
  return <hr className={cn('border-0 border-t border-[var(--rule)]', className)} />
}

/** 区块标题：左侧一道竖线，长度即层级 */
export function SectionHead({
  children,
  sub,
  right,
}: {
  children: ReactNode
  sub?: ReactNode
  right?: ReactNode
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="section-title">{children}</h2>
        {sub && <p className="mt-1 pl-[1.4rem] text-small muted">{sub}</p>}
      </div>
      {right}
    </div>
  )
}

/** 小标签：不是装饰性 eyebrow，而是真正的字段名 */
export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('label', className)}>{children}</span>
}

/* ------------------------------------------------------------------
 * 记忆点：错位的两张牌
 *
 * 这个游戏的全部张力就是「两张几乎一样的牌」。
 * 所以它同时承担三件事：Landing 的主视觉、发牌动画、投票行。
 * ------------------------------------------------------------------ */
export function CardPair({
  top,
  bottom,
  size = 'md',
  className,
}: {
  top: string
  bottom: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const dims = {
    sm: 'w-[104px] h-[136px] p-3 text-base',
    md: 'w-[132px] h-[172px] p-4 text-xl',
    lg: 'w-[176px] h-[228px] p-5 text-3xl',
  }[size]

  return (
    <div className={cn('relative', className)}>
      {/* 后牌：牌背，压暗并向左下错开 */}
      <div
        className={cn(
          'paper absolute left-0 top-0 flex items-center justify-center font-bold',
          dims,
        )}
        style={{
          transform: 'translate(-14px, 16px) rotate(-7deg)',
          background: 'var(--danger)',
          color: '#fff',
          boxShadow: 'none',
        }}
        aria-hidden
      >
        <span className="text-center leading-tight">{bottom}</span>
      </div>

      {/* 前牌：正面，词面朝上 */}
      <div
        className={cn(
          'paper relative flex items-center justify-center font-bold leading-tight',
          dims,
        )}
      >
        {top}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------
 * 按钮
 * ------------------------------------------------------------------ */
type BtnTone = 'solid' | 'outline' | 'quiet' | 'danger'

const BTN_TONE: Record<BtnTone, string> = {
  solid: 'bg-[var(--ink)] text-[var(--bg)] border-[var(--ink)] hover:opacity-90',
  outline:
    'bg-transparent text-[var(--ink)] border-[var(--rule-2)] hover:bg-[var(--raised-2)] hover:border-[var(--ink-3)]',
  quiet: 'bg-transparent text-[var(--ink-2)] border-transparent hover:text-[var(--ink)] hover:bg-[var(--raised)]',
  danger: 'bg-transparent text-[var(--danger)] border-[var(--danger)] hover:bg-[var(--danger-soft)]',
}

export function Btn({
  children,
  onClick,
  tone = 'solid',
  size = 'md',
  full,
  loading,
  disabled,
  type = 'button',
  className,
  title,
}: {
  children: ReactNode
  onClick?: () => void
  tone?: BtnTone
  size?: 'sm' | 'md'
  full?: boolean
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit'
  className?: string
  title?: string
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      title={title}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-card border font-semibold transition-all duration-150',
        'disabled:pointer-events-none disabled:opacity-45',
        size === 'sm' ? 'px-3 py-1.5 text-small' : 'px-4 py-2.5 text-body',
        full && 'w-full',
        BTN_TONE[tone],
        className,
      )}
    >
      {loading && <Spinner size={14} />}
      {children}
    </button>
  )
}

/** 唯一的加载指示器。23 个组件里有 8 种花哨 loader，
 *  现在收敛成一个 —— 加载状态不需要表演。 */
export function Spinner({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn('inline-block shrink-0 animate-spin rounded-full border-2', className)}
      style={{
        width: size,
        height: size,
        borderColor: 'currentColor',
        borderTopColor: 'transparent',
        opacity: 0.7,
      }}
      role="status"
      aria-label="加载中"
    />
  )
}

/* ------------------------------------------------------------------
 * 字段
 * ------------------------------------------------------------------ */
export function Field({
  label,
  value,
  onChange,
  onEnter,
  placeholder,
  type = 'text',
  inputMode,
  maxLength,
  autoComplete,
  disabled,
  hint,
  className,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  onEnter?: () => void
  placeholder?: string
  type?: string
  inputMode?: 'text' | 'numeric' | 'email' | 'tel' | 'url' | 'search'
  maxLength?: number
  autoComplete?: string
  disabled?: boolean
  hint?: ReactNode
  className?: string
}) {
  return (
    <label className={cn('block', className)}>
      <span className="label">{label}</span>
      <input
        type={type}
        value={value}
        inputMode={inputMode}
        maxLength={maxLength}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onEnter) {
            e.preventDefault()
            onEnter()
          }
        }}
        className="input-base mt-1.5"
      />
      {hint && <span className="mt-1.5 block text-micro faint">{hint}</span>}
    </label>
  )
}

/* ------------------------------------------------------------------
 * 统计数字：大号 + 小标签，靠浓淡分层，不装进卡片里
 * ------------------------------------------------------------------ */
export function Stat({
  value,
  label,
  tone = 'ink',
  className,
}: {
  value: ReactNode
  label: string
  tone?: 'ink' | 'accent' | 'ready' | 'danger'
  className?: string
}) {
  const color = {
    ink: 'var(--ink)',
    accent: 'var(--accent)',
    ready: 'var(--ready)',
    danger: 'var(--danger)',
  }[tone]

  return (
    <div className={cn('min-w-0', className)}>
      <div
        className="tnum truncate text-[1.75rem] font-bold leading-none"
        style={{ color }}
      >
        {value}
      </div>
      <div className="label mt-1.5">{label}</div>
    </div>
  )
}

/* ------------------------------------------------------------------
 * 空状态：给出下一步，而不是一句「暂无数据」
 * ------------------------------------------------------------------ */
export function Empty({
  title,
  hint,
  action,
}: {
  title: string
  hint?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-start gap-4 border border-dashed border-[var(--rule-2)] rounded-panel px-6 py-12">
      <div>
        <p className="display text-title">{title}</p>
        {hint && <p className="mt-1.5 max-w-measure text-small muted">{hint}</p>}
      </div>
      {action}
    </div>
  )
}

/* ------------------------------------------------------------------
 * Toast
 * ------------------------------------------------------------------ */
export function Toast({
  kind,
  children,
}: {
  kind: 'info' | 'success' | 'error'
  children: ReactNode
}) {
  const bar = {
    info: 'var(--ink-3)',
    success: 'var(--ready)',
    error: 'var(--danger)',
  }[kind]

  return (
    <div
      role="status"
      className="pop pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-card border border-[var(--rule-2)] bg-[var(--raised-2)] px-4 py-3 shadow-[var(--lift-2)]"
    >
      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: bar }} />
      <p className="text-small">{children}</p>
    </div>
  )
}
