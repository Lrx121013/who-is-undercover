import { useId } from 'react'
import { cn } from '../../lib/utils'
import './ClockSelector.css'

interface Props {
  options: (string | number)[]
  value: number
  onChange: (index: number) => void
  caption?: string
  unit?: string
  className?: string
}

/** 时钟样式选择器（by SelfMadeSystem）：6 档旋转指针 —— 房间人数 / 发言限时 */
export default function ClockSelector({
  options,
  value,
  onChange,
  caption,
  unit,
  className,
}: Props) {
  const name = useId()
  const opts = options.slice(0, 6)
  const clamped = Math.min(Math.max(value, 0), opts.length - 1)

  return (
    <div className={cn('inline-flex flex-col items-center', className)}>
      <div className="clock-input">
        {opts.map((_, i) => (
          <input
            key={i}
            type="radio"
            name={name}
            checked={clamped === i}
            onChange={() => onChange(i)}
          />
        ))}
        {opts.map((_, i) => (
          <label key={i} onClick={() => onChange(i)} />
        ))}
        <div className="dial" />
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <span key={n} className="notch" style={{ ['--n' as string]: n }} />
        ))}
        <span className="clock-readout">{opts[clamped]}{unit}</span>
      </div>
      {caption && <div className="clock-input__caption">{caption}</div>}
    </div>
  )
}
