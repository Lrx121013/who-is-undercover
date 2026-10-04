import { useEffect, useState } from 'react'

/** 简易打COOKIE同意横幅：不打断流程，点抹后 localStorage 永不再弹 */
export default function CookieBanner() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    try {
      if (!localStorage.getItem('wiu_cookie_ok')) setShow(true)
    } catch {
      /* ignore */
    }
  }, [])
  if (!show) return null
  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-[var(--rule)] bg-[var(--bg)] px-5 py-4">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 text-small muted">
        <p className="flex-1 min-w-[260px]">
          这个站点会在本地保存登录状态与偏好设置。继续使用即表示你同意存放必要 Cookie。
        </p>
        <button
          className="rounded-card border border-[var(--rule-2)] px-4 py-2 text-small font-semibold transition-colors hover:bg-[var(--raised-2)]"
          onClick={() => {
            try {
              localStorage.setItem('wiu_cookie_ok', '1')
            } catch {
              /* ignore */
            }
            setShow(false)
          }}
        >
          知道了
        </button>
      </div>
    </div>
  )
}
