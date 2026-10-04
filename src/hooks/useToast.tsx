import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Toast } from '../components/primitives'

interface Item {
  id: number
  text: string
  type: 'success' | 'error' | 'info'
}

interface ToastCtx {
  toast: (text: string, type?: Item['type']) => void
}

const Ctx = createContext<ToastCtx>({ toast: () => {} })

export function useToast() {
  return useContext(Ctx)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Item[]>([])
  const idRef = useRef(0)
  const timers = useRef<number[]>([])

  const toast = useCallback((text: string, type: Item['type'] = 'info') => {
    const id = ++idRef.current
    setToasts((t) => [...t, { id, text, type }])
    // 同一时刻最多留 3 条，再多就把最旧的挤掉
    setToasts((t) => t.slice(-3))
    const h = window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
      timers.current = timers.current.filter((x) => x !== h)
    }, 3000)
    timers.current.push(h)
  }, [])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <Ctx.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-20 left-1/2 z-[100] flex w-[min(92vw,26rem)] -translate-x-1/2 flex-col items-center gap-2 md:bottom-8"
      >
        {toasts.map((t) => (
          <Toast key={t.id} kind={t.type}>
            {t.text}
          </Toast>
        ))}
      </div>
    </Ctx.Provider>
  )
}
