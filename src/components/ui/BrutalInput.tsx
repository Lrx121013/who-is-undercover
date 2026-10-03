import { cn } from '../../lib/utils'
import './BrutalInput.css'

interface Props {
  placeholder?: string
  value: string
  onChange: (v: string) => void
  onEnter?: () => void
  icon?: React.ReactNode
  full?: boolean
  maxLength?: number
  className?: string
  inputMode?: 'text' | 'numeric' | 'email' | 'search'
}

/** 新粗野主义输入框（by anniekoop）：验证码 / 搜索 */
export default function BrutalInput({
  placeholder,
  value,
  onChange,
  onEnter,
  icon,
  full = false,
  maxLength,
  className,
  inputMode = 'text',
}: Props) {
  return (
    <div className={cn('brutal-wrap', className)}>
      {icon && <span className="text-slate-500 dark:text-slate-300">{icon}</span>}
      <input
        className={cn('input', full && 'input--full', 'dark:input--dark')}
        type="text"
        inputMode={inputMode}
        placeholder={placeholder}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
      />
    </div>
  )
}
