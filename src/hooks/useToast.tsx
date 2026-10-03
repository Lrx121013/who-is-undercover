import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

interface Toast {
  id: number
  text: string
  type: 'success' | 'error' | 'info'
}

interface ToastCtx {
  toast: (text: string, type?: Toast['type']) => void
}

const Ctx = createContext<ToastCtx>({ toast: () => {} })

export function useToast() {
  return useContext(Ctx)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)

  const toast = useCallback((text: string, type: Toast['type'] = 'info') => {
    const id = ++idRef.current
    setToasts((t) => [...t, { id, text, type }])
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600)
  }, [])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-24 left-1/2 z-[100] flex w-[min(92vw,420px)] -translate-x-1/2 flex-col items-center gap-2 md:bottom-8">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              'fade-up pointer-events-auto rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-xl backdrop-blur-md',
              t.type === 'success' &&
                'border-emerald-400/40 bg-emerald-500/20 text-emerald-100',
              t.type === 'error' && 'border-rose-400/40 bg-rose-500/20 text-rose-100',
              t.type === 'info' && 'border-white/15 bg-black/60 text-white',
            ].join(' ')}
          >
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}
