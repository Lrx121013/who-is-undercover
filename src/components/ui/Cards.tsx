import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'
import './Cards.css'

export type CardColor = 'red' | 'blue' | 'green' | 'purple' | 'amber' | 'cyan'

export interface CardItem {
  key: string
  title: string
  subtitle?: string
  color?: CardColor
  icon?: ReactNode
  badge?: string
  onClick?: () => void
}

interface Props {
  items: CardItem[]
  className?: string
}

/** 卡片组（by kamehame-ha）：悬停聚焦、其余模糊 —— 好友列表/房间列表/战绩 */
export default function Cards({ items, className }: Props) {
  return (
    <div className={cn('cards', className)}>
      {items.map((it) => (
        <div
          key={it.key}
          className={cn('card', it.color || 'blue')}
          onClick={it.onClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && it.onClick?.()}
        >
          {it.icon && <div className="mb-1 flex items-center gap-1.5 text-sm font-bold">{it.icon}</div>}
          <p className="tip">
            {it.title}
            {it.badge && (
              <span className="ml-2 rounded-full bg-black/25 px-2 py-0.5 text-[10px] align-middle">
                {it.badge}
              </span>
            )}
          </p>
          {it.subtitle && <p className="second-text mt-0.5 opacity-80">{it.subtitle}</p>}
        </div>
      ))}
    </div>
  )
}
