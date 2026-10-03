/** 通用小工具 */

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

const AVATAR_COLORS = [
  ['#ff5569', '#8b1435'],
  ['#4facfe', '#00f2fe'],
  ['#c8f060', '#60f0b8'],
  ['#a18cd1', '#fbc2eb'],
  ['#ffc371', '#ff5f6d'],
  ['#62abff', '#4f29f0'],
]

export function avatarDataUri(name: string): string {
  const n = (name || '?').trim() || '?'
  let h = 0
  for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) % 997
  const [c1, c2] = AVATAR_COLORS[h % AVATAR_COLORS.length]
  const ch = n[0]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="96" height="96" rx="48" fill="url(#g)"/><text x="48" y="62" font-size="44" font-family="sans-serif" fill="#ffffff" text-anchor="middle">${ch}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

/** 内置的派对风格预设头像（emoji + 渐变色，生成内联 SVG，无需外部图床） */
const PRESET_EMOJIS = ['🕵️', '🐱', '🐼', '🦊', '🐸', '🐧', '🦄', '🐯', '👻', '🤖', '🐙', '🍕']

export function presetAvatars(): string[] {
  return PRESET_EMOJIS.map((emoji, i) => {
    const [c1, c2] = AVATAR_COLORS[i % AVATAR_COLORS.length]
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="96" height="96" rx="48" fill="url(#g)"/><text x="48" y="60" font-size="46" text-anchor="middle" dominant-baseline="middle">${emoji}</text></svg>`
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
  })
}

export function expToLevel(exp: number): number {
  return Math.floor((exp || 0) / 100) + 1
}

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024

/** 头像文件校验，返回错误文案或 null（合法） */
export function validateAvatarFile(file: File): string | null {
  if (!file.type.startsWith('image/')) return '请选择图片文件'
  if (file.size > AVATAR_MAX_BYTES) return '图片过大，请压缩到 2MB 以内'
  return null
}

export function randomCode(len = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

export function formatTime(ts?: string | null): string {
  if (!ts) return ''
  const d = new Date(ts)
  const p = (x: number) => String(x).padStart(2, '0')
  return `${d.getMonth() + 1}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/**
 * 合并实时推送的消息，避免与本地乐观插入的临时消息重复。
 * 临时消息 id 以 `tmp-` 开头，收到同人同内容的真实行时原地替换。
 */
export function mergeMessage<T extends { id: string; user_id: string; content: string }>(
  prev: T[],
  row: T,
): T[] {
  if (prev.some((m) => m.id === row.id)) return prev
  const idx = prev.findIndex(
    (m) => m.id.startsWith('tmp-') && m.user_id === row.user_id && m.content === row.content,
  )
  if (idx >= 0) {
    const next = prev.slice()
    next[idx] = row
    return next
  }
  return [...prev, row]
}

/** WebAudio 提示音（无需音频资源），受「游戏音效」偏好控制 */
let audioCtx: AudioContext | null = null

export function playBeep(freq = 880, ms = 180): void {
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    audioCtx ??= new AC()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.value = 0.06
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.start()
    osc.stop(audioCtx.currentTime + ms / 1000)
  } catch {
    /* 音频不可用时静默忽略 */
  }
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const ROLE_LABEL: Record<string, string> = {
  civilian: '平民',
  undercover: '卧底',
  white: '白板',
  detective: '侦探',
  prophet: '预言家',
  disturber: '干扰者',
  double: '双面人',
  stand_in: '替身',
  third_party: '第三方',
}
