import { useRef, useState } from 'react'
import { cn } from '../../lib/utils'
import './TakeOffButton.css'

interface Props {
  /** 默认状态文字 */
  label?: string
  /** 发送成功后的文字 */
  sentLabel?: string
  /** 紧凑模式 */
  compact?: boolean
  disabled?: boolean
  className?: string
  /** 点击后执行；返回 false 的 Promise 不显示发送成功态 */
  onAction?: () => unknown | Promise<unknown>
  onClick?: () => void
  children?: React.ReactNode
}

function Letters({ text }: { text: string }) {
  return (
    <p>
      {text.split('').map((c, i) => (
        <span key={i} style={{ ['--i' as string]: i }}>
          {c === ' ' ? '\u00A0' : c}
        </span>
      ))}
    </p>
  )
}

export default function TakeOffButton({
  label = '发送',
  sentLabel = '已发送',
  compact = false,
  disabled = false,
  className,
  onAction,
  onClick,
  children,
}: Props) {
  const [sent, setSent] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)

  const handle = async () => {
    onClick?.()
    if (!onAction) {
      setSent(true)
      window.setTimeout(() => setSent(false), 2200)
      return
    }
    btnRef.current?.focus()
    const r = await onAction() as unknown as boolean | undefined
    if (r !== false) setSent(true)
    else setSent(false)
  }

  return (
    <div className="takeoff-scope">
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={handle}
        className={cn('button', compact && 'is-compact', sent && 'is-sent', className)}
      >
        {children ?? (
          <>
            <div className="state state--default">
              <Letters text={label} />
              <span className="icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </span>
            </div>
            <div className="state state--sent">
              <span className="icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
                  />
                </svg>
              </span>
              <Letters text={sentLabel} />
            </div>
            <div className="outline" />
          </>
        )}
      </button>
    </div>
  )
}
