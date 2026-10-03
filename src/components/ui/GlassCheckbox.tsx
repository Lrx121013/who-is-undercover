import { cn } from '../../lib/utils'
import './GlassCheckbox.css'

interface Props {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  sub?: string
  disabled?: boolean
  className?: string
}

/** 玻璃拟态复选框（by ahmed_8975）：绿色渐变 + 涟漪 —— 角色配置 / 隐私设置 */
export default function GlassCheckbox({ checked, onChange, label, sub, disabled, className }: Props) {
  return (
    <label className={cn('gl-checkbox', disabled && 'pointer-events-none opacity-50', className)}>
      <input
        type="checkbox"
        className="gl-checkbox__input"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="gl-checkbox__box">
        <svg
          className="gl-checkbox__check"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
      <span className="gl-checkbox__label">
        {label}
        {sub && <span className="ml-1.5 text-xs opacity-60">{sub}</span>}
      </span>
    </label>
  )
}
