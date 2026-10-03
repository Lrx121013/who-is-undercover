import { cn } from '../../lib/utils'
import './MaterialSwitch.css'

interface Props {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
  disabled?: boolean
  className?: string
}

/** Material 开关（Voxybuns）：房间设置 / 在线状态 */
export default function MaterialSwitch({ checked, onChange, label, disabled, className }: Props) {
  return (
    <label className={cn('switch-scope inline-flex items-center gap-3', className)}>
      <span className="switch">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="slider" />
      </span>
      {label && <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>}
    </label>
  )
}
