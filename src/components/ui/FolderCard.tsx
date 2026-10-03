import { useState } from 'react'
import { cn } from '../../lib/utils'
import './FolderCard.css'

export interface FolderFile {
  text: string
  tag?: string
}

interface Props {
  name: string
  files?: FolderFile[]
  count?: number
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSelect?: () => void
  onFileClick?: (file: FolderFile, index: number) => void
  hint?: string
  badge?: string
  className?: string
}

/** 3D 文件夹卡片（by byllzz）：点开文件扇形弹出 —— 房间卡 / 词库卡 / 投票详情 */
export default function FolderCard({
  name,
  files = [],
  count,
  open,
  onOpenChange,
  onSelect,
  onFileClick,
  hint = '点我打开',
  badge,
  className,
}: Props) {
  const [inner, setInner] = useState(false)
  const isOpen = open ?? inner
  const list = files.slice(0, 5)
  const num = count ?? files.length

  const toggle = () => {
    const next = !isOpen
    setInner(next)
    onOpenChange?.(next)
    onSelect?.()
  }

  return (
    <div className={cn('folder-card', className)}>
      <input
        type="checkbox"
        className="folder-toggle"
        checked={isOpen}
        onChange={toggle}
        aria-label={name}
      />
      <div className="hint-wrapper">
        <span className="hint-text">{hint}</span>
        <svg className="hint-arrow" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5">
          <path d="M4 12h10M13 8l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20 4v16" strokeLinecap="round" />
        </svg>
      </div>
      <div className="folder-container">
        <div className="counter" title={`${num} 个文件`}>
          <span className="status-dot" />
          <span className="counter-number">{num}</span>
          <span className="counter-label">files</span>
        </div>

        <div className="folder-back">
          <svg width="100%" height="112" viewBox="0 0 170 112" preserveAspectRatio="none">
            <path
              d="M5 16 Q5 7 14 7 H62 L74 17 H156 Q165 17 165 26 V100 Q165 109 156 109 H14 Q5 109 5 100 Z"
              fill="#1d4ed8"
            />
          </svg>
        </div>

        {list.map((f, i) => (
          <div
            key={i}
            className={`file file-${i + 1}`}
            onClick={(e) => {
              e.stopPropagation()
              onFileClick?.(f, i)
            }}
          >
            <div className="shine" />
            <span className="file-text">{f.text}</span>
            <svg className="file-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
            </svg>
            {f.tag && <span className="file-tag">{f.tag}</span>}
          </div>
        ))}

        <div className="folder-front-wrapper">
          <svg width="100%" height="88" viewBox="0 0 170 88" preserveAspectRatio="none">
            <path
              d="M0 12 Q0 4 8 4 H58 L70 14 H162 Q170 14 170 22 V76 Q170 84 162 84 H8 Q0 84 0 76 Z"
              fill="#3b82f6"
            />
          </svg>
          <div className="folder-label" />
        </div>
      </div>
      <div className="mt-1 w-full text-center">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{name}</span>
        {badge && <span className="ml-1 text-[10px] muted">· {badge}</span>}
      </div>
    </div>
  )
}
