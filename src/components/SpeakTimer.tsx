import { useEffect, useState } from 'react'
import { cn } from '../lib/utils'
import '../components/ui/ClockSelector.css'
import './SpeakTimer.css'

interface Props {
  /** 总秒数 */
  total: number
  /** 结束时间戳（ms），到达后回调 onEnd */
  endsAt: number | null
  onEnd?: () => void
  size?: number
  label?: string
}

/** 发言计时：复用时钟选择器表盘视觉，指针随剩余时间旋转 */
export default function SpeakTimer({ total, endsAt, onEnd, label }: Props) {
  const [remain, setRemain] = useState(total)

  useEffect(() => {
    if (!endsAt) {
      setRemain(total)
      return
    }
    const tick = () => {
      const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
      setRemain(left)
      if (left <= 0) onEnd?.()
    }
    tick()
    const t = window.setInterval(tick, 250)
    return () => window.clearInterval(t)
  }, [endsAt, total, onEnd])

  const ratio = total > 0 ? remain / total : 0
  const deg = -120 + (1 - ratio) * 240

  return (
    <div className={cn('speak-timer flex flex-col items-center', remain <= 10 && 'speak-timer--danger')}>
      <div className="clock-input">
        <div className="dial" style={{ transform: `rotate(${deg}deg)` }} />
        <span className="clock-readout">{remain}</span>
      </div>
      {label && <div className="clock-input__caption">{label}</div>}
    </div>
  )
}
