/** 数据库实体类型（与 supabase/schema.sql 对应） */

export type RoleName =
  | 'civilian'
  | 'undercover'
  | 'white'
  | 'detective'
  | 'prophet'
  | 'disturber'
  | 'double'
  | 'stand_in'
  | 'third_party'

export interface Profile {
  id: string
  nickname: string
  avatar_url: string | null
  bio: string | null
  gender: string | null
  birthday: string | null
  level: number
  exp: number
  total_games: number
  win_count: number
  short_id?: string
  show_online?: boolean
  email_verified?: boolean
  created_at: string
}

export interface Friendship {
  id: string
  user_a: string
  user_b: string
  status: 'pending' | 'accepted' | 'blocked'
  created_at: string
}

export interface FriendRequest {
  id: string
  from_user: string
  to_user: string
  message: string | null
  status: 'pending' | 'accepted' | 'rejected' | 'expired'
  created_at: string
  expires_at: string | null
}

export interface Block {
  id: string
  user_id: string
  blocked_user_id: string
  created_at: string
}

export type RoomStatus = 'waiting' | 'playing' | 'finished'

export interface RoomSettings {
  /** 自由角色配比：自定义角色列表，重复即代表多个（如两个侦探）。为空即「平民 + 卧底」经典模式 */
  special_roles?: RoleName[]
  /** 卧底人数；null / 省略表示按人数自动 */
  undercover_count?: number | null
  /** 旧版开关式角色配置，仅用于兼容老房间，新房间不再写入 */
  roles?: Partial<Record<RoleName, boolean>>
  word_pack_id?: string | null
  categories?: string[]
  difficulty?: number
  speak_order?: 'random' | 'cw' | 'ccw'
  speak_time?: number
  max_players?: number
  password_room?: boolean
  enable_vote?: boolean
  enable_timer?: boolean
  enable_review?: boolean
  // 运行时游戏状态（房主客户端写入）
  game_phase?: 'deal' | 'speak' | 'vote' | 'settle' | 'finished'
  round?: number
  current_speaker?: string | null
  phase_ends_at?: number | null
  /** 本轮发言顺序（user_id 列表，房主写入后全房间同步，避免各端随机不一致） */
  speak_order_ids?: string[]
}

export interface Room {
  id: string
  room_code: string
  host_id: string
  password: string | null
  max_players: number
  settings: RoomSettings
  status: RoomStatus
  created_at: string
}

export interface RoomMember {
  id: string
  room_id: string
  user_id: string
  is_ready: boolean
  role: RoleName | null
  word: string | null
  is_alive: boolean
  joined_at: string
  // join 出来的资料
  profiles?: Profile
}

export interface Game {
  id: string
  room_id: string
  winner: 'civilian' | 'undercover' | 'third_party' | null
  started_at: string | null
  ended_at: string | null
}

export interface GamePlayer {
  id: string
  game_id: string
  user_id: string
  role: string
  word: string | null
  is_winner: boolean
  votes_received: number
  profiles?: Profile
}

export interface WordPack {
  id: string
  name: string
  description: string | null
  cover_url: string | null
  author_id: string
  is_public: boolean
  likes: number
  created_at: string
  profiles?: Profile
  word_pairs?: WordPair[]
}

export interface WordPair {
  id: string
  pack_id: string
  civilian_word: string
  undercover_word: string
  difficulty: number
  category: string | null
}

export interface Achievement {
  id: string
  name: string
  description: string | null
  icon: string | null
  condition: Record<string, unknown> | null
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  unlocked_at: string
  achievements?: Achievement
}

export interface NotificationRow {
  id: string
  user_id: string
  type: 'friend_request' | 'room_invite' | 'achievement' | 'system'
  content: Record<string, unknown>
  is_read: boolean
  created_at: string
}

export interface Message {
  id: string
  room_id: string
  user_id: string
  content: string
  created_at: string
  profiles?: Profile
}

export interface VoteRow {
  id: string
  room_id: string
  round: number
  voter_id: string
  target_id: string
  created_at: string
}
