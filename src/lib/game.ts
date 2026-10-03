import type { RoleName, RoomMember, RoomSettings, VoteRow } from '../types/db'
import { ROLE_LABEL, shuffle } from './utils'

export type Winner = 'civilian' | 'undercover' | 'third_party'

/** 可自由选配的特殊角色（平民 / 卧底为固定底座，不在此列） */
export const SPECIAL_ROLES: RoleName[] = [
  'white',
  'detective',
  'prophet',
  'double',
  'disturber',
  'stand_in',
  'third_party',
]

/** 角色说明，用于配置面板 */
export const ROLE_DESC: Record<string, string> = {
  civilian: '拿到平民词，找出卧底',
  undercover: '拿到相近的卧底词，隐藏自己',
  white: '没有词，靠听别人描述蒙混',
  detective: '可查验一名玩家是否为卧底',
  prophet: '每轮可知场上卧底人数',
  double: '同时拿到平民与卧底两个词',
  disturber: '拿到平民词，但目标是搅局',
  stand_in: '替身，平民阵营的伪装者',
  third_party: '活到最后即为胜利',
}

export const DEFAULT_SETTINGS: RoomSettings = {
  special_roles: [],
  undercover_count: null,
  word_pack_id: null,
  categories: [],
  difficulty: 3,
  speak_order: 'random',
  speak_time: 60,
  max_players: 6,
  password_room: false,
  enable_vote: true,
  enable_timer: true,
  enable_review: true,
}

/** 最少可开局人数：2 人即可（1 卧底 1 平民），平票时随机出局避免死循环 */
export const MIN_PLAYERS = 2

/** 卧底人数：显式配置优先，否则按人数自动；始终保证 1 ≤ uc ≤ n-1 */
export function resolveUndercoverCount(n: number, settings?: RoomSettings): number {
  if (n <= 1) return 1
  const explicit = settings?.undercover_count
  if (explicit && explicit >= 1) return Math.min(explicit, n - 1)
  const auto = n <= 5 ? 1 : n <= 9 ? 2 : 3
  return Math.max(1, Math.min(auto, n - 1))
}

/** 取自定义角色列表（新字段优先，旧 roles 布尔表兜底），剔除平民与卧底 */
export function specialRolesFrom(settings?: RoomSettings): RoleName[] {
  if (Array.isArray(settings?.special_roles)) {
    return settings.special_roles.filter((r) => r !== 'civilian' && r !== 'undercover')
  }
  const map = settings?.roles
  if (!map) return []
  return SPECIAL_ROLES.filter((r) => map[r])
}

/** 计算本局角色池（未打乱）：卧底 + 自定义角色 + 平民补齐 */
export function composeRolePool(n: number, settings?: RoomSettings): RoleName[] {
  if (n <= 0) return []
  const uc = resolveUndercoverCount(n, settings)
  const pool: RoleName[] = []
  for (let i = 0; i < uc; i++) pool.push('undercover')
  pool.push(...specialRolesFrom(settings))
  const trimmed = pool.slice(0, n)
  while (trimmed.length < n) trimmed.push('civilian')
  return trimmed
}

/** 角色池中各角色数量（用于配置预览） */
export function rolePoolCounts(n: number, settings?: RoomSettings): Array<{ role: RoleName; count: number }> {
  const counts = new Map<RoleName, number>()
  for (const r of composeRolePool(n, settings)) counts.set(r, (counts.get(r) ?? 0) + 1)
  return [...counts.entries()].map(([role, count]) => ({ role, count }))
}

/** 胜负判定（与数据库 settle_round 保持一致） */
export function checkWinner(members: RoomMember[]): Winner | null {
  const total = members.length
  const alive = members.filter((m) => m.is_alive)
  const uc = alive.filter((m) => m.role === 'undercover').length
  const other = alive.length - uc
  const third = alive.filter((m) => m.role === 'third_party').length
  const eliminated = total - alive.length

  if (uc === 0) return 'civilian'
  if (uc > other) return 'undercover'
  // 人数持平即视为卧底控场（但开局满员的对峙不算，避免 1v1 一开局就结束）
  if (uc === other && uc > 0 && eliminated > 0) return 'undercover'
  if (third > 0 && other <= 2) return 'third_party'
  return null
}

/** 发言顺序：优先沿用已同步的 user_id 顺序，否则按设置计算 */
export function speakOrder(
  members: RoomMember[],
  settings: RoomSettings,
  seedIds?: string[] | null,
): RoomMember[] {
  const alive = members.filter((m) => m.is_alive)
  if (seedIds && seedIds.length) {
    const map = new Map(alive.map((m) => [m.user_id, m]))
    const ordered = seedIds.map((id) => map.get(id)).filter((m): m is RoomMember => Boolean(m))
    const rest = alive.filter((m) => !seedIds.includes(m.user_id))
    return [...ordered, ...rest]
  }
  if (settings.speak_order === 'cw') return alive
  if (settings.speak_order === 'ccw') return [...alive].reverse()
  return shuffle(alive)
}

/** 生成一轮发言顺序（房主写入 settings 供全房间同步） */
export function makeSpeakOrderIds(members: RoomMember[], settings: RoomSettings): string[] {
  return speakOrder(members, settings).map((m) => m.user_id)
}

/** 统计每轮投票 */
export function tallyVotes(votes: VoteRow[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const v of votes) out[v.target_id] = (out[v.target_id] || 0) + 1
  return out
}

export interface EliminateResult {
  targetId: string | null
  counts: Record<string, number>
  tie: boolean
}

/** 统计本轮出局者：平票无人出局；仅剩 2 人时随机出局避免死循环 */
export function resolveVotes(votes: VoteRow[], aliveIds?: string[]): EliminateResult {
  const counts = tallyVotes(votes)
  const entries = Object.entries(counts)
  const randomOfTwo = () =>
    aliveIds && aliveIds.length === 2 ? aliveIds[Math.floor(Math.random() * 2)] : null

  if (entries.length === 0) {
    return { targetId: randomOfTwo(), counts, tie: false }
  }
  const max = Math.max(...entries.map(([, c]) => c))
  const tops = entries.filter(([, c]) => c === max).map(([id]) => id)
  if (tops.length === 1) return { targetId: tops[0], counts, tie: false }
  return { targetId: randomOfTwo(), counts, tie: true }
}

export function roleLabel(role: string | null): string {
  return role ? ROLE_LABEL[role] || role : '未分配'
}