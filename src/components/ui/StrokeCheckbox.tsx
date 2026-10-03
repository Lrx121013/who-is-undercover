import { cn } from '../../lib/utils'
import './StrokeCheckbox.css'

interface Props {
  checked: boolean
  onChange: (v: boolean) => void
  label: React.ReactNode
  disabled?: boolean
  size?: number
  className?: string
}

/** 描边复选框（by andrew-manzyk）：线条描画 —— 投票 / 分组 / 词库收藏 */
export default function StrokeCheckbox({
  checked,
  onChange,
  label,
  disabled,
  size = 1.3,
  className,
}: Props) {
  return (
    <label
      className={cn('checkbox', disabled && 'pointer-events-none opacity-50', className)}
      style={{ ['--checkbox-size' as string]: `${size}rem` }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="checkmark">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="1" y="1" width="22" height="22" rx="5" strokeWidth="2" />
          <polyline points="6 12 10 16 18 7" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
        <span className="text-sm">{label}</span>
      </span>
    </label>
  )
}
