import { useId, useState } from 'react'
import { cn } from '../../lib/utils'
import './FloatingInput.css'

interface Props {
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  onEnter?: () => void
  error?: string
  required?: boolean
  full?: boolean
  maxLength?: number
  autoComplete?: string
  className?: string
  right?: React.ReactNode
}

/** 浮动标签输入框（by VijinV）：邮箱 / 密码 / 房间号 / 词条 */
export default function FloatingInput({
  label,
  type = 'text',
  value,
  onChange,
  onEnter,
  error,
  required = true,
  full = false,
  maxLength,
  autoComplete,
  className,
  right,
}: Props) {
  const id = useId()
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword && show ? 'text' : type

  return (
    <div className={cn(full && 'inputbox--full', className)}>
      <div className={cn('inputbox', full && 'inputbox--full')}>
        <input
          id={id}
          type={inputType}
          required={required}
          value={value}
          maxLength={maxLength}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
        />
        <span onClick={() => document.getElementById(id)?.focus()}>{label}</span>
        <i />
        {isPassword ? (
          <button
            type="button"
            className="inputbox__right text-xs font-bold"
            onClick={() => setShow((s) => !s)}
          >
            {show ? '隐藏' : '显示'}
          </button>
        ) : (
          right && <span className="inputbox__right">{right}</span>
        )}
      </div>
      {error && <p className="inputbox__error">{error}</p>}
    </div>
  )
}
