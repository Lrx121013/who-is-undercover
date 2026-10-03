import { useId } from 'react'
import { cn } from '../../lib/utils'
import './PerCharInput.css'

interface Props {
  label: string
  value: string
  onChange: (v: string) => void
  onEnter?: () => void
  full?: boolean
  maxLength?: number
  className?: string
}

/** 逐字浮动标签输入框（by liyaxu123）：字母逐个跳起 —— 昵称 / 词库名 */
export default function PerCharInput({
  label,
  value,
  onChange,
  onEnter,
  full = false,
  maxLength = 20,
  className,
}: Props) {
  const id = useId()
  return (
    <div className={cn('form-control', full && 'form-control--full', className)}>
      <input
        id={id}
        type="text"
        required
        value={value}
        maxLength={maxLength}
        placeholder=" "
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
      />
      <label htmlFor={id}>
        {label.split('').map((c, i) => (
          <span key={i} style={{ transitionDelay: `${i * 30}ms` }}>
            {c === ' ' ? '\u00A0' : c}
          </span>
        ))}
      </label>
    </div>
  )
}
