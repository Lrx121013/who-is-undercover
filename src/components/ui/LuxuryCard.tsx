import { cn } from '../../lib/utils'
import './LuxuryCard.css'

const TROPHY =
  'M7 4V2h10v2h4v3a4 4 0 0 1-4 4h-.35A5.99 5.99 0 0 1 13 13.91V18h4v2H7v-2h4v-4.09A5.99 5.99 0 0 1 7.35 11H7a4 4 0 0 1-4-4V4h4zm2 2H5v1a2 2 0 0 0 1 1.73V6zm10 0v2.73A2 2 0 0 0 19 7V6h-2z'

interface Props {
  value: string
  footer?: string
  caption?: string
  className?: string
  onClick?: () => void
}

/** 奢华卡片（by Smit-Prajapati）：金色描边荣誉卡 —— MVP / 成就 / 段位 */
export default function LuxuryCard({ value, footer = 'honor', caption, className, onClick }: Props) {
  return (
    <div className={cn('luxury-scope inline-block', className)} onClick={onClick}>
      <div className="card">
        <div className="border" />
        <div className="content">
          <div className="logo">
            <svg className="logo1" viewBox="0 0 24 24" style={{ width: 33, height: 33 }}>
              <path d={TROPHY} fill="#bd9f67" />
            </svg>
            <svg className="logo-main" viewBox="0 0 24 24" style={{ width: 33, height: 35 }}>
              <path d={TROPHY} />
            </svg>
            <svg className="logo2" viewBox="0 0 24 24" style={{ width: 33, height: 33 }}>
              <path d={TROPHY} />
            </svg>
            <div className="trail" />
          </div>
          <div className="logo-bottom-text">{value}</div>
        </div>
        {caption && (
          <p className="absolute left-1/2 top-3 -translate-x-1/2 text-xs font-bold text-[#bd9f67]">
            {caption}
          </p>
        )}
        <div className="bottom-text">{footer}</div>
      </div>
    </div>
  )
}
