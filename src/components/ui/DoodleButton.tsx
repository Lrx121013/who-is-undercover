import { cn } from '../../lib/utils'
import DashSpinLoader from './DashSpinLoader'
import './DoodleButton.css'

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

/** 涂鸦线条按钮（by himanshu9682）：主 CTA，A/B/C 三配色，可内嵌小加载 */
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
  return (
    <div className={cn('doodle-scope', size === 'full' && 'w-full')}>
      <button
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        className={cn(
          'button',
          `type--${variant}`,
          size === 'sm' && 'button--sm',
          size === 'full' && 'button--full',
          className,
        )}
      >
        <p className="button__text">
          <span>{children}</span>
        </p>
        <div className="button__line" />
        <div className="button__line" />
        <div className="button__drow1" />
        <div className="button__drow2" />
        {loading && (
          <span className="button__loading">
            <DashSpinLoader color="var(--line_color)" />
          </span>
        )}
      </button>
    </div>
  )
}
