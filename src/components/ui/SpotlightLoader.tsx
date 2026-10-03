import { cn } from '../../lib/utils'
import './SpotlightLoader.css'

interface Props {
  text?: string
  scale?: number
  fullscreen?: boolean
  className?: string
}

/** 文字光斑加载器（by dexter-st）：登录 / 注册提交时的仪式感加载 */
export default function SpotlightLoader({
  text = 'LOADING',
  scale = 1.4,
  fullscreen = false,
  className,
}: Props) {
  const inner = (
    <div className="spotlight-scope" style={{ ['--spotlight-scale' as string]: scale }}>
      <div className="loader-wrapper">
        <div className="loader" />
        {text.split('').map((c, i) => (
          <span
            key={i}
            className="loader-letter"
            style={{ animationDelay: `${0.1 + i * 0.105}s` }}
          >
            {c === ' ' ? '\u00A0' : c}
          </span>
        ))}
      </div>
    </div>
  )

  if (fullscreen) {
    return (
      <div
        className={cn(
          'fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink-900/95 backdrop-blur-sm',
          className,
        )}
      >
        {inner}
      </div>
    )
  }
  return <div className={cn('flex justify-center', className)}>{inner}</div>
}
