import { cn } from '../../lib/utils'
import './ClToggleSwitch.css'

interface Props {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
  disabled?: boolean
  className?: string
}

/** Material 开关（by lenin55）：备选风格，用于设置页 */
export default function ClToggleSwitch({
  checked,
  onChange,
  label,
  disabled,
  className,
}: Props) {
  return (
    <span className={cn('cl-toggle-switch', className)}>
      <label className="cl-switch">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>{label}</span>
      </label>
    </span>
  )
}
