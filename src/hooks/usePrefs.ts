import { useCallback, useEffect, useState } from 'react'

const KEY = 'wiu-prefs'

export interface Prefs {
  /** 接收站内通知 */
  notify: boolean
  /** 游戏音效 */
  sound: boolean
  /** 震动反馈 */
  vibrate: boolean
  /** 战绩对好友可见 */
  publicStats: boolean
  /** 允许昵称搜索 */
  nicknameSearch: boolean
  /** 允许邮箱搜索 */
  emailSearch: boolean
}

export const DEFAULT_PREFS: Prefs = {
  notify: true,
  sound: true,
  vibrate: false,
  publicStats: true,
  nicknameSearch: true,
  emailSearch: false,
}

function read(): Prefs {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}') as Partial<Prefs>
    return { ...DEFAULT_PREFS, ...raw }
  } catch {
    return DEFAULT_PREFS
  }
}

/** 本机偏好：读写 localStorage，切换即自动保存，刷新不丢失 */
export function usePrefs() {
  const [prefs, setPrefs] = useState<Prefs>(read)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs))
    } catch {
      /* 隐私模式下写入失败可忽略 */
    }
  }, [prefs])

  const setPref = useCallback(<K extends keyof Prefs>(key: K, value: Prefs[K]) => {
    setPrefs((p) => ({ ...p, [key]: value }))
  }, [])

  return { prefs, setPref }
}