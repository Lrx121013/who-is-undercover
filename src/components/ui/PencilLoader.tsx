import './PencilLoader.css'

interface Props {
  text?: string
  fullscreen?: boolean
  size?: number
}

/** 铅笔动画（by gustavofusco）：App 首屏 / 路由切换加载 */
export default function PencilLoader({ text = '努力出题中…', fullscreen = false, size = 96 }: Props) {
  const svg = (
    <svg
      className="pencil"
      viewBox="0 0 200 200"
      fill="none"
      style={{ width: size, height: size }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        className="pencil__stroke"
        d="M0 0 L0 210"
        stroke="#cbd5e1"
        strokeWidth="4"
        strokeDasharray="439.82"
      />
      <g className="pencil__rotate" transform="translate(100 100)">
        <circle
          className="pencil__body1"
          cx="0"
          cy="0"
          r="56"
          stroke="#94a3b8"
          strokeWidth="4"
          strokeDasharray="351.86"
        />
        <circle
          className="pencil__body2"
          cx="0"
          cy="0"
          r="64.75"
          stroke="#64748b"
          strokeWidth="4"
          strokeDasharray="406.84"
        />
        <circle
          className="pencil__body3"
          cx="0"
          cy="0"
          r="47.25"
          stroke="#cbd5e1"
          strokeWidth="4"
          strokeDasharray="296.88"
        />
        <g className="pencil__eraser-skew">
          <rect className="pencil__eraser" x="-7" y="-12" width="14" height="24" rx="4" fill="#ff5569" />
        </g>
        <polygon className="pencil__point" points="0,-11 9,0 0,11" fill="#f59e0b" />
      </g>
    </svg>
  )

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-slate-100 dark:bg-ink-900">
        {svg}
        <p className="text-sm font-semibold tracking-widest text-slate-500 dark:text-slate-400">{text}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      {svg}
      {text && <p className="text-xs font-semibold tracking-widest muted">{text}</p>}
    </div>
  )
}
