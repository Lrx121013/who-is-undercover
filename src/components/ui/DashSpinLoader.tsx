import { cn } from '../../lib/utils'
import './DashSpinLoader.css'

interface Props {
  size?: number
  color?: string
  className?: string
  withRing?: boolean
}

/** Dash Spin 加载器（by SelfMadeSystem）：内联轻量小加载 / 按钮内小加载 */
export default function DashSpinLoader({
  size = 28,
  color = 'currentColor',
  className,
  withRing = false,
}: Props) {
  return (
    <div className={cn('dash-scope', className)} style={{ fontSize: size }}>
      <div className="loader">
        <svg
          className="w-2"
          style={{ width: '1em', height: '1em' }}
          viewBox="0 0 100 100"
          fill="none"
        >
          <circle
            className="spin"
            cx="50"
            cy="50"
            r="40"
            pathLength="360"
            stroke={color}
            strokeWidth="8"
            opacity={withRing ? 1 : 0.9}
          />
          <circle
            className="dash"
            cx="50"
            cy="50"
            r="40"
            pathLength="360"
            stroke={color}
            strokeWidth="8"
          />
        </svg>
      </div>
    </div>
  )
}
