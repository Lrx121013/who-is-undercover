import { cn } from '../../lib/utils'
import './WifiLoader.css'

interface Props {
  text?: string
  scale?: number
  className?: string
  frontColor?: string
}

/** WiFi 加载器（by mobinkakei）：搜索好友加载中 */
export default function WifiLoader({
  text = 'searching',
  scale = 0.38,
  className,
  frontColor,
}: Props) {
  return (
    <div
      className={cn('wifi-scope', className)}
      style={{
        zoom: scale,
        ...(frontColor ? ({ ['--front-color' as string]: frontColor } as React.CSSProperties) : {}),
      }}
    >
      <svg className="circle-outer">
        <circle className="back" cx="43" cy="43" r="40" />
        <circle className="front" cx="43" cy="43" r="40" />
      </svg>
      <svg className="circle-middle">
        <circle className="back" cx="30" cy="30" r="27" />
        <circle className="front" cx="30" cy="30" r="27" />
      </svg>
      <svg className="circle-inner">
        <circle className="back" cx="17" cy="17" r="14" />
        <circle className="front" cx="17" cy="17" r="14" />
      </svg>
      <div className="text" data-text={text} />
    </div>
  )
}
