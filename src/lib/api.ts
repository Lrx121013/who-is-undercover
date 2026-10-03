import { supabase } from './supabase'
import type {
  Achievement,
  Block,
  FriendRequest,
  Friendship,
  Game,
  GamePlayer,
  Message,
  NotificationRow,
  Profile,
  Room,
  RoomMember,
  RoomSettings,
  UserAchievement,
  VoteRow,
  WordPack,
  WordPair,
} from '../types/db'
import { randomCode, validateAvatarFile } from './utils'

/* ---------------- 实时订阅 ---------------- */
export function subscribe(
  name: string,
  table: string,
  filter: string,
  cb: (payload: unknown) => void,
) {
  const ch = supabase
    .channel(name)
    .on('postgres_changes', { event: '*', schema: 'public', table, filter }, cb)
    .subscribe()
  return () => {
    void supabase.removeChannel(ch)
  }
}

/* ---------------- 用户资料 ---------------- */
export async function getProfile(id: string): Promise<Profile | null> {
  const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle()
  return (data as Profile) ?? null
}

export async function updateProfile(id: string, patch: Partial<Profile>): Promise<void> {
  const { error } = await supabase.from('profiles').update(patch).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function uploadAvatar(uid: string, file: File): Promise<string> {
  const invalid = validateAvatarFile(file)
  if (invalid) throw new Error(invalid)
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const path = `${uid}/${randomCode(8)}.${ext}`
  const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
  if (error) throw new Error('头像上传失败：' + error.message)
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}

export async function searchUsers(keyword: string): Promise<Profile[]> {
  const kw = keyword.trim()
  if (!kw) return []
  const { data, error } = await supabase.rpc('search_users', { keyword: kw })
  if (error) throw new Error(error.message)
  return (data as Profile[]) ?? []
}

/* ---------------- 好友 ---------------- */
export async function listFriends(): Promise<Friendship[]> {
  const { data } = await supabase.from('friendships').select('*').eq('status', 'accepted')
  return (data as Friendship[]) ?? []
}

export async function listFriendProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.rpc('list_friends')
  if (error) throw new Error(error.message)
  return (data as Profile[]) ?? []
}

export async function listIncomingRequests(uid: string): Promise<(FriendRequest & { from: Profile })[]> {
  const { data } = await supabase
    .from('friend_requests')
    .select('*, from:profiles!friend_requests_from_user_fkey(*)')
    .eq('to_user', uid)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  return ((data ?? []) as (FriendRequest & { from: Profile })[])
}

export async function listOutgoingRequests(uid: string): Promise<(FriendRequest & { to: Profile })[]> {
  const { data } = await supabase
    .from('friend_requests')
    .select('*, to:profiles!friend_requests_to_user_fkey(*)')
    .eq('from_user', uid)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  return ((data ?? []) as (FriendRequest & { to: Profile })[])
}

export async function sendFriendRequest(toUser: string, message?: string): Promise<void> {
  const { error } = await supabase.rpc('send_friend_request', {
    to_user_id: toUser,
    msg: message ?? null,
  })
  if (error) throw new Error(error.message)
}

export async function respondRequest(id: string, action: 'accepted' | 'rejected'): Promise<void> {
  const rpc = action === 'accepted' ? 'accept_friend_request' : 'reject_friend_request'
  const { error } = await supabase.rpc(rpc, { request_id: id })
  if (error) throw new Error(error.message)
}

export async function unfriend(id: string): Promise<void> {
  const { error } = await supabase.rpc('unfriend', { friend_id: id })
  if (error) throw new Error(error.message)
}

export async function blockUser(id: string): Promise<void> {
  const { error } = await supabase.rpc('block_user', { target_id: id })
  if (error) throw new Error(error.message)
}

export async function unblockUser(id: string): Promise<void> {
  const { error } = await supabase.rpc('unblock_user', { target_id: id })
  if (error) throw new Error(error.message)
}

export async function listBlocks(): Promise<Block[]> {
  const { data } = await supabase.from('blocks').select('*')
  return (data as Block[]) ?? []
}

/* ---------------- 通知 ---------------- */
export async function listNotifications(): Promise<NotificationRow[]> {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  return (data as NotificationRow[]) ?? []
}

export async function markNotificationRead(id: string): Promise<void> {
  await supabase.from('notifications').update({ is_read: true }).eq('id', id)
}

export async function markAllNotificationsRead(): Promise<void> {
  await supabase.from('notifications').update({ is_read: true }).eq('is_read', false)
}

export async function pushNotification(
  toUser: string,
  type: string,
  content: Record<string, unknown>,
): Promise<void> {
  await supabase.rpc('push_notification', { p_user: toUser, p_type: type, p_content: content })
}

/* ---------------- 房间 ---------------- */
export async function listRooms(): Promise<Room[]> {
  const { data } = await supabase
    .from('rooms')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30)
  return (data as Room[]) ?? []
}

export async function getRoomByCode(code: string): Promise<Room | null> {
  const { data } = await supabase.from('rooms').select('*').eq('room_code', code).maybeSingle()
  return (data as Room) ?? null
}

export async function getRoomById(id: string): Promise<Room | null> {
  const { data } = await supabase.from('rooms').select('*').eq('id', id).maybeSingle()
  return (data as Room) ?? null
}

export async function createRoom(settings: RoomSettings, password?: string): Promise<Room> {
  const { data, error } = await supabase.rpc('create_room', {
    settings: settings as never,
    pwd: password?.trim() ? password.trim() : null,
  })
  if (error) throw new Error(error.message)
  return data as Room
}

export async function joinRoom(code: string, password?: string): Promise<Room> {
  const { data, error } = await supabase.rpc('join_room', {
    code: code.trim().toUpperCase(),
    pwd: password?.trim() ? password.trim() : null,
  })
  if (error) throw new Error(translateRoomError(error.message))
  return data as Room
}

function translateRoomError(msg: string): string {
  if (/房间不存在/.test(msg)) return '房间不存在，请检查房间号'
  if (/密码/.test(msg)) return '房间密码不正确'
  if (/已满/.test(msg)) return '房间已满'
  if (/游戏中/.test(msg)) return '该房间游戏已开始'
  return msg
}

export async function leaveRoom(roomId: string): Promise<void> {
  const { error } = await supabase.rpc('leave_room', { p_room: roomId })
  if (error) throw new Error(error.message)
}

export async function listMembers(roomId: string): Promise<RoomMember[]> {
  const { data } = await supabase
    .from('room_members')
    .select('*, profiles(*)')
    .eq('room_id', roomId)
    .order('joined_at', { ascending: true })
  return (data as RoomMember[]) ?? []
}

export async function setReady(memberId: string, ready: boolean): Promise<void> {
  const { error } = await supabase.from('room_members').update({ is_ready: ready }).eq('id', memberId)
  if (error) throw new Error(error.message)
}

export async function kickMember(roomId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('room_members').delete().eq('room_id', roomId).eq('user_id', userId)
  if (error) throw new Error(error.message)
}

export async function transferHost(roomId: string, userId: string): Promise<void> {
  const { error } = await supabase.rpc('transfer_host', { p_room: roomId, p_host: userId })
  if (error) throw new Error(error.message)
}

export async function updateRoomSettings(roomId: string, settings: RoomSettings): Promise<void> {
  const { error } = await supabase.from('rooms').update({ settings: settings as never }).eq('id', roomId)
  if (error) throw new Error(error.message)
}

export async function closeRoom(roomId: string): Promise<void> {
  const { error } = await supabase.from('rooms').update({ status: 'finished' }).eq('id', roomId)
  if (error) throw new Error(error.message)
}

/* ---------------- 房间聊天 ---------------- */
export async function sendMessage(roomId: string, content: string): Promise<void> {
  const uid = (await supabase.auth.getUser()).data.user?.id
  if (!uid) return
  const { error } = await supabase.from('messages').insert({ room_id: roomId, user_id: uid, content })
  if (error) throw new Error(error.message)
}

export async function listMessages(roomId: string): Promise<Message[]> {
  const { data } = await supabase
    .from('messages')
    .select('*, profiles(*)')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })
    .limit(100)
  return (data as Message[]) ?? []
}

/* ---------------- 游戏 ---------------- */
export async function startGame(roomId: string): Promise<void> {
  const { error } = await supabase.rpc('start_game', { p_room: roomId })
  if (error) throw new Error(translateRoomError(error.message))
}

export async function listVotes(roomId: string, round: number): Promise<VoteRow[]> {
  const { data } = await supabase
    .from('votes')
    .select('*')
    .eq('room_id', roomId)
    .eq('round', round)
  return (data as VoteRow[]) ?? []
}

export async function submitVote(roomId: string, round: number, targetId: string): Promise<void> {
  const { error } = await supabase.rpc('submit_vote', { p_room: roomId, p_round: round, p_target: targetId })
  if (error) throw new Error(error.message)
}

/** 房主手动淘汰（关闭投票器时使用） */
export async function eliminateMember(roomId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('room_members')
    .update({ is_alive: false })
    .eq('room_id', roomId)
    .eq('user_id', userId)
  if (error) throw new Error(error.message)
}

/** 侦探查验：由服务端判定目标是否为卧底，避免开牌作弊式读取 */
export async function investigate(roomId: string, targetId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('investigate', { p_room: roomId, p_target: targetId })
  if (error) throw new Error(error.message)
  return Boolean(data)
}

/** 结算本轮，返回胜方（null 表示继续） */
export async function settleRound(roomId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('settle_round', { p_room: roomId })
  if (error) throw new Error(error.message)
  return (data as string | null) ?? null
}

export async function setPhase(
  roomId: string,
  patch: RoomSettings,
): Promise<void> {
  const room = await getRoomById(roomId)
  if (!room) return
  await updateRoomSettings(roomId, { ...room.settings, ...patch })
}

export async function getGame(roomId: string): Promise<Game | null> {
  const { data } = await supabase
    .from('games')
    .select('*')
    .eq('room_id', roomId)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as Game) ?? null
}

export async function getGamePlayers(gameId: string): Promise<GamePlayer[]> {
  const { data } = await supabase.from('game_players').select('*, profiles(*)').eq('game_id', gameId)
  return (data as GamePlayer[]) ?? []
}

/* ---------------- 词库 ---------------- */
export async function listPublicPacks(): Promise<WordPack[]> {
  const { data } = await supabase
    .from('word_packs')
    .select('*, profiles(nickname, avatar_url), word_pairs(*)')
    .eq('is_public', true)
    .order('likes', { ascending: false })
    .limit(50)
  return (data as WordPack[]) ?? []
}

export async function listMyPacks(): Promise<WordPack[]> {
  const uid = (await supabase.auth.getUser()).data.user?.id
  if (!uid) return []
  const { data } = await supabase
    .from('word_packs')
    .select('*, word_pairs(*)')
    .eq('author_id', uid)
    .order('created_at', { ascending: false })
  return (data as WordPack[]) ?? []
}

export async function getPack(id: string): Promise<WordPack | null> {
  const { data } = await supabase
    .from('word_packs')
    .select('*, profiles(nickname), word_pairs(*)')
    .eq('id', id)
    .maybeSingle()
  return (data as WordPack) ?? null
}

export async function createPack(name: string, description?: string, isPublic = false): Promise<WordPack> {
  const uid = (await supabase.auth.getUser()).data.user?.id
  if (!uid) throw new Error('请先登录')
  const { data, error } = await supabase
    .from('word_packs')
    .insert({ name, description: description ?? null, author_id: uid, is_public: isPublic })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as WordPack
}

export async function addPairs(
  packId: string,
  pairs: Array<{ civilian_word: string; undercover_word: string; difficulty: number; category?: string }>,
): Promise<void> {
  const rows = pairs
    .filter((p) => p.civilian_word.trim() && p.undercover_word.trim())
    .map((p) => ({
      pack_id: packId,
      civilian_word: p.civilian_word.trim(),
      undercover_word: p.undercover_word.trim(),
      difficulty: p.difficulty,
      category: p.category ?? null,
    }))
  if (rows.length === 0) return
  const { error } = await supabase.from('word_pairs').insert(rows)
  if (error) throw new Error(error.message)
}

export async function deletePair(id: string): Promise<void> {
  await supabase.from('word_pairs').delete().eq('id', id)
}

export async function likePack(id: string): Promise<void> {
  await supabase.rpc('like_pack', { p_pack: id })
}

export async function deletePack(id: string): Promise<void> {
  await supabase.from('word_packs').delete().eq('id', id)
}

/* ---------------- 成就 / 排行 ---------------- */
export async function leaderboard(
  order: 'win_count' | 'level' | 'total_games' = 'win_count',
): Promise<Profile[]> {
  const { data } = await supabase
    .from('profiles')
    .select('id, nickname, avatar_url, level, exp, total_games, win_count')
    .order(order, { ascending: false })
    .limit(20)
  return (data as Profile[]) ?? []
}

export async function listAchievements(): Promise<Achievement[]> {
  const { data } = await supabase.from('achievements').select('*')
  return (data as Achievement[]) ?? []
}

export async function myAchievements(): Promise<UserAchievement[]> {
  const uid = (await supabase.auth.getUser()).data.user?.id
  if (!uid) return []
  const { data } = await supabase
    .from('user_achievements')
    .select('*, achievements(*)')
    .eq('user_id', uid)
  return (data as UserAchievement[]) ?? []
}

export async function myGameStats(uid: string) {
  const { data } = await supabase.from('game_players').select('*').eq('user_id', uid)
  const rows = (data as GamePlayer[]) ?? []
  const stats = {
    total: rows.length,
    wins: rows.filter((r) => r.is_winner).length,
    undercover: rows.filter((r) => r.role === 'undercover').length,
    undercoverWins: rows.filter((r) => r.role === 'undercover' && r.is_winner).length,
    votes: rows.reduce((s, r) => s + (r.votes_received || 0), 0),
  }
  return stats
}

export interface RecentGame {
  id: string
  game_id: string
  role: string
  word: string | null
  is_winner: boolean
  votes_received: number
  games: { winner: string | null; ended_at: string | null } | null
}

/** 最近对局：取最近若干条战绩并按结束时间倒序 */
export async function recentGames(uid: string, limit = 8): Promise<RecentGame[]> {
  const { data, error } = await supabase
    .from('game_players')
    .select('id, game_id, role, word, is_winner, votes_received, games(winner, ended_at)')
    .eq('user_id', uid)
    .limit(30)
  if (error) return []
  const rows = (data as unknown as RecentGame[]) ?? []
  return rows
    .sort((a, b) => (b.games?.ended_at ?? '').localeCompare(a.games?.ended_at ?? ''))
    .slice(0, limit)
}
