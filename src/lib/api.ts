import { gql, currentUserId } from './db'
import { nhost } from './nhost'

/*
 * 与 Nhost/Hasura GraphQL 对应：
 *   表 by name → <t>(...)
 *   表-function 作为 mutation → <fn>(args: {...}) { ... }
 * 若某个函数或关系字段名跟 Hasura 实际不一致，只改这里对应一行即可。
 * 注意：GraphQL 字符串无法被编译器类型检查，语义需你一次 authed 调用实测。
 */

export function subscribe(
  name: string,
  table: string,
  filter: string,
  cb: (payload: unknown) => void,
) {
  let closed = false
  const seen = new Set<string>()
  const colMatch = /(\w+)=eq\.(.+)/.exec(filter || '')
  const col = colMatch?.[1]
  const val = colMatch?.[2]
  const run = async () => {
    const where = col ? `where: { ${col}: { _eq: "${val}" } }, ` : ''
    const { data } = await gql<{ [k: string]: any[] }>(
      `query { ${table}(${where}limit: 50) { id created_at } }`,
    )
    const rows = (data?.[table] ?? []) as any[]
    rows.forEach((r) => {
      if (!seen.has(r.id)) {
        const isNew = seen.size > 0
        seen.add(r.id)
        if (isNew) cb({ new: r })
      }
    })
  }
  void run()
  const timer = setInterval(() => {
    if (!closed) void run()
  }, 2500)
  return () => {
    closed = true
    clearInterval(timer)
  }
}

const PROFILE_COLS =
  'id nickname avatar_url bio gender birthday level exp total_games win_count short_id show_online created_at'

export async function getProfile(id: string) {
  const { data } = await gql<{ profiles_by_pk: any }>(
    `query($id: uuid!) { profiles_by_pk(id: $id) { ${PROFILE_COLS} } }`,
    { id },
  )
  return data?.profiles_by_pk ?? null
}

export async function updateProfile(id: string, patch: Record<string, unknown>) {
  const { error } = await gql(
    `mutation($id: uuid!, $set: profiles_set_input!) { update_profiles_by_pk(pk_columns: {id: $id}, _set: $set) { id } }`,
    { id, set: patch },
  )
  if (error) throw new Error(error.message)
}

export async function uploadAvatar(uid: string, file: File): Promise<string> {
  const cfg: any = nhost as any
  const subdomain = (nhost as any).subdomain ?? 'wdcepbrekhxwnzcoereg'
  const base = `https://${subdomain}.storage.ap-southeast-1.nhost.run/v1/files`
  const token = nhost.auth.getSession()?.accessToken
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const path = `${uid}/${crypto.randomUUID().slice(0, 8)}.${ext}`
  const fd = new FormData()
  fd.append('file', file, file.name)
  fd.append('name', path)
  fd.append('bucket_id', 'avatars')
  const res = await fetch(base, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  })
  if (!res.ok) throw new Error('头像上传失败')
  const j = await res.json()
  return `https://${subdomain}.storage.ap-southeast-1.nhost.run/v1/files/${j.id ?? j.image}`
}

export async function searchUsers(keyword: string) {
  const kw = keyword.trim()
  if (!kw) return []
  const { data, error } = await gql<{ search_users: any[] }>(
    `mutation($kw: String!) { search_users(args: {keyword: $kw}) { id nickname avatar_url level bio } }`,
    { kw },
  )
  if (error) throw new Error(error.message)
  return data?.search_users ?? []
}

export async function listFriends() {
  const { data } = await gql<{ friendships: any[] }>(
    `query { friendships(where: {status: {_eq: "accepted"}}) { id user_a user_b status created_at } }`,
  )
  return data?.friendships ?? []
}

export async function listFriendProfiles() {
  const { data, error } = await gql<{ list_friends: any[] }>(
    `mutation { list_friends(args: {}) { id nickname avatar_url level exp total_games win_count short_id } }`,
  )
  if (error) throw new Error(error.message)
  return data?.list_friends ?? []
}

export async function listIncomingRequests(uid: string) {
  const { data } = await gql<{ friend_requests: any[] }>(
    `query($uid: uuid!) { friend_requests(where: {to_user: {_eq: $uid}, status: {_eq: "pending"}}, order_by: {created_at: desc}) { id from_user to_user message status created_at } }`,
    { uid },
  )
  return data?.friend_requests ?? []
}

export async function listOutgoingRequests(uid: string) {
  const { data } = await gql<{ friend_requests: any[] }>(
    `query($uid: uuid!) { friend_requests(where: {from_user: {_eq: $uid}, status: {_eq: "pending"}}, order_by: {created_at: desc}) { id from_user to_user message status created_at } }`,
    { uid },
  )
  return data?.friend_requests ?? []
}

export async function sendFriendRequest(toUser: string, message?: string) {
  const { error } = await gql(
    `mutation($id: uuid!, $msg: String) { send_friend_request(args: {to_user_id: $id, msg: $msg}) { id } }`,
    { id: toUser, msg: message ?? null },
  )
  if (error) throw new Error(error.message)
}

export async function respondRequest(id: string, action: 'accepted' | 'rejected') {
  const fn = action === 'accepted' ? 'accept_friend_request' : 'reject_friend_request'
  const { error } = await gql(
    `mutation($id: uuid!) { ${fn}(args: {request_id: $id}) { id } }`,
    { id },
  )
  if (error) throw new Error(error.message)
}

export async function unfriend(friendId: string) {
  const { error } = await gql(
    `mutation($id: uuid!) { unfriend(args: {friend_id: $id}) { id } }`,
    { id: friendId },
  )
  if (error) throw new Error(error.message)
}

export async function blockUser(id: string) {
  const { error } = await gql(
    `mutation($id: uuid!) { block_user(args: {target_id: $id}) { id } }`,
    { id },
  )
  if (error) throw new Error(error.message)
}

export async function unblockUser(id: string) {
  const { error } = await gql(
    `mutation($id: uuid!) { unblock_user(args: {target_id: $id}) { id } }`,
    { id },
  )
  if (error) throw new Error(error.message)
}

export async function listBlocks() {
  const { data } = await gql<{ blocks: any[] }>(`query { blocks { id user_id blocked_user_id created_at } }`)
  return data?.blocks ?? []
}

/** 返回正在游戏的成员 user_id 列表 */
export async function listPlayingMemberIds() {
  const { data } = await gql<{ room_members: any[] }>(
    `query { room_members(where: {rooms: {status: {_eq: "playing"}}}) { user_id } }`,
  )
  return ((data?.room_members ?? []) as any[]).map((r) => r.user_id as string)
}

/** 返回我拉黑的用户资料 */
export async function listBlockedProfiles() {
  const blocks = await listBlocks()
  const ids = blocks.map((b: any) => b.blocked_user_id).filter(Boolean)
  if (!ids.length) return []
  const { data } = await gql<{ profiles: any[] }>(
    `query($ids: [uuid!]) { profiles(where: {id: {_in: $ids}}) { ${PROFILE_COLS} } }`,
    { ids },
  )
  return data?.profiles ?? []
}

export async function listNotifications() {
  const { data } = await gql<{ notifications: any[] }>(
    `query { notifications(order_by: {created_at: desc}, limit: 50) { id user_id type content is_read created_at } }`,
  )
  return data?.notifications ?? []
}

export async function markNotificationRead(id: string) {
  await gql(`mutation($id: uuid!) { update_notifications_by_pk(pk_columns: {id: $id}, _set: {is_read: true}) { id } }`, { id })
}

export async function markAllNotificationsRead() {
  await gql(`mutation { update_notifications(where: {is_read: {_eq: false}}, _set: {is_read: true}) { affected_rows } }`)
}

export async function pushNotification(toUser: string, type: string, content: Record<string, unknown>) {
  await gql(`mutation($u: uuid!, $t: String!, $c: jsonb!) { push_notification(args: {p_user: $u, p_type: $t, p_content: $c}) { id } }`, {
    u: toUser,
    t: type,
    c: content,
  })
}

export async function listRooms() {
  const { data } = await gql<{ rooms: any[] }>(
    `query { rooms(where: {status: {_eq: "waiting"}}, order_by: {created_at: desc}, limit: 30) { id room_code host_id password max_players settings status created_at } }`,
  )
  return data?.rooms ?? []
}

export async function getRoomByCode(code: string) {
  const { data } = await gql<{ rooms: any[] }>(
    `query($code: String!) { rooms(where: {room_code: {_eq: $code}}, limit: 1) { id room_code host_id password max_players settings status created_at } }`,
    { code },
  )
  return data?.rooms?.[0] ?? null
}

export async function getRoomById(id: string) {
  const { data } = await gql<{ rooms_by_pk: any }>(
    `query($id: uuid!) { rooms_by_pk(id: $id) { id room_code host_id password max_players settings status created_at } }`,
    { id },
  )
  return data?.rooms_by_pk ?? null
}

export async function createRoom(settings: any, password?: string) {
  const { data, error } = await gql<{ create_room: any }>(
    `mutation($s: jsonb, $p: String) { create_room(args: {settings: $s, pwd: $p}) { id room_code host_id password max_players settings status created_at } }`,
    { s: settings, p: password?.trim() ? password.trim() : null },
  )
  if (error) throw new Error(error.message)
  return data?.create_room
}

export async function joinRoom(code: string, password?: string) {
  const { data, error } = await gql<{ join_room: any }>(
    `mutation($code: String!, $p: String) { join_room(args: {code: $code, pwd: $p}) { id room_code host_id password max_players settings status created_at } }`,
    { code: code.trim().toUpperCase(), p: password?.trim() ? password.trim() : null },
  )
  if (error) throw new Error(translateRoomError(error.message))
  return data?.join_room
}

function translateRoomError(msg: string): string {
  if (/房间不存在/.test(msg)) return '房间不存在，请检查房间号'
  if (/密码/.test(msg)) return '房间密码不正确'
  if (/已满/.test(msg)) return '房间已满'
  if (/游戏中/.test(msg)) return '该房间游戏已开始'
  return msg
}

export async function leaveRoom(roomId: string) {
  const { error } = await gql(`mutation($id: uuid!) { leave_room(args: {p_room: $id}) { id } }`, { id: roomId })
  if (error) throw new Error(error.message)
}

export async function listMembers(roomId: string) {
  const { data } = await gql<{ room_members: any[] }>(
    `query($id: uuid!) { room_members(where: {room_id: {_eq: $id}}, order_by: {joined_at: asc}) { id room_id user_id is_ready role word is_alive joined_at profiles { nickname avatar_url } } }`,
    { id: roomId },
  )
  return data?.room_members ?? []
}

export async function setReady(memberId: string, ready: boolean) {
  const { error } = await gql(
    `mutation($id: uuid!, $ready: Boolean!) { update_room_members_by_pk(pk_columns: {id: $id}, _set: {is_ready: $ready}) { id } }`,
    { id: memberId, ready },
  )
  if (error) throw new Error(error.message)
}

export async function kickMember(roomId: string, userId: string) {
  const { error } = await gql(
    `mutation($r: uuid!, $u: uuid!) { delete_room_members(where: {room_id: {_eq: $r}, user_id: {_eq: $u}}) { affected_rows } }`,
    { r: roomId, u: userId },
  )
  if (error) throw new Error(error.message)
}

export async function transferHost(roomId: string, userId: string) {
  const { error } = await gql(`mutation($r: uuid!, $u: uuid!) { transfer_host(args: {p_room: $r, p_host: $u}) { id } }`, { r: roomId, u: userId })
  if (error) throw new Error(error.message)
}

export async function updateRoomSettings(roomId: string, settings: any) {
  const { error } = await gql(
    `mutation($id: uuid!, $s: jsonb!) { update_rooms_by_pk(pk_columns: {id: $id}, _set: {settings: $s}) { id } }`,
    { id: roomId, s: settings },
  )
  if (error) throw new Error(error.message)
}

export async function closeRoom(roomId: string) {
  const { error } = await gql(
    `mutation($id: uuid!) { update_rooms_by_pk(pk_columns: {id: $id}, _set: {status: "finished"}) { id } }`,
    { id: roomId },
  )
  if (error) throw new Error(error.message)
}

export async function resetRoomForRestart(roomId: string) {
  const { error } = await gql(
    `mutation($id: uuid!) { update_rooms_by_pk(pk_columns: {id: $id}, _set: {status: "waiting"}) { id } }`,
    { id: roomId },
  )
  if (error) throw new Error(error.message)
}

export async function sendMessage(roomId: string, content: string) {
  const uid = await currentUserId()
  if (!uid) return
  const { error } = await gql(
    `mutation($r: uuid!, $u: uuid!, $c: String!) { insert_messages_one(object: {room_id: $r, user_id: $u, content: $c}) { id } }`,
    { r: roomId, u: uid, c: content },
  )
  if (error) throw new Error(error.message)
}

export async function listMessages(roomId: string) {
  const { data } = await gql<{ messages: any[] }>(
    `query($id: uuid!) { messages(where: {room_id: {_eq: $id}}, order_by: {created_at: asc}, limit: 100) { id room_id user_id content created_at profiles { nickname avatar_url } } }`,
    { id: roomId },
  )
  return data?.messages ?? []
}

export async function startGame(roomId: string) {
  const { error } = await gql(`mutation($id: uuid!) { start_game(args: {p_room: $id}) { id } }`, { id: roomId })
  if (error) throw new Error(translateRoomError(error.message))
}

export async function listVotes(roomId: string, round: number) {
  const { data } = await gql<{ votes: any[] }>(
    `query($r: uuid!, $n: Int!) { votes(where: {room_id: {_eq: $r}, round: {_eq: $n}}) { id room_id round voter_id target_id created_at } }`,
    { r: roomId, n: round },
  )
  return data?.votes ?? []
}

export async function listMyPendingReluctant(roomId: string) {
  return []
}

export async function submitVote(roomId: string, round: number, targetId: string) {
  const { error } = await gql(
    `mutation($r: uuid!, $n: Int!, $t: uuid!) { submit_vote(args: {p_room: $r, p_round: $n, p_target: $t}) { id } }`,
    { r: roomId, n: round, t: targetId },
  )
  if (error) throw new Error(error.message)
}

export async function eliminateMember(roomId: string, userId: string) {
  const { error } = await gql(
    `mutation($r: uuid!, $u: uuid!) { update_room_members(where: {room_id: {_eq: $r}, user_id: {_eq: $u}}, _set: {is_alive: false}) { affected_rows } }`,
    { r: roomId, u: userId },
  )
  if (error) throw new Error(error.message)
}

export async function investigate(roomId: string, targetId: string): Promise<boolean> {
  const { error } = await gql(`mutation($r: uuid!, $t: uuid!) { investigate(args: {p_room: $r, p_target: $t}) { id } }`, { r: roomId, t: targetId })
  if (error) throw new Error(error.message)
  // 调查结果由服务端写入 notifications，UI 应再读通知
  const { data } = await gql<{ notifications: any[] }>(
    `query { notifications(where: {type: {_eq: "investigate_result"}}, order_by: {created_at: desc}, limit: 1) { content } }`,
  )
  const content = data?.notifications?.[0]?.content
  return Boolean(content?.is_undercover)
}

export async function settleRound(roomId: string) {
  const { error } = await gql(`mutation($id: uuid!) { settle_round(args: {p_room: $id}) { id } }`, { id: roomId })
  if (error) throw new Error(error.message)
  const room = await getRoomById(roomId)
  return room?.settings?.last_winner ?? null
}

export async function finishGame(roomId: string, winner: string) {
  const { error } = await gql(`mutation($r: uuid!, $w: String!) { finish_game(args: {p_room: $r, p_winner: $w}) { id } }`, { r: roomId, w: winner })
  if (error) throw new Error(error.message)
}

export async function setPhase(roomId: string, patch: any) {
  const room = await getRoomById(roomId)
  if (!room) return
  await updateRoomSettings(roomId, { ...room.settings, ...patch })
}

export async function resetRoomMembers(roomId: string): Promise<void> {
  const { error } = await gql(
    `mutation($id: uuid!) { update_room_members(where: {room_id: {_eq: $id}}, _set: {is_ready: false, is_alive: true, role: null, word: null}) { affected_rows } }`,
    { id: roomId },
  )
  if (error) throw new Error(error.message)
}

export async function getGame(roomId: string) {
  const { data } = await gql<{ games: any[] }>(
    `query($id: uuid!) { games(where: {room_id: {_eq: $id}}, order_by: {started_at: desc}, limit: 1) { id room_id winner started_at ended_at } }`,
    { id: roomId },
  )
  return data?.games?.[0] ?? null
}

export async function getGamePlayers(gameId: string) {
  const { data } = await gql<{ game_players: any[] }>(
    `query($g: uuid!) { game_players(where: {game_id: {_eq: $g}}) { id game_id user_id role word is_winner votes_received profiles { nickname avatar_url } } }`,
    { g: gameId },
  )
  return data?.game_players ?? []
}

export async function listRoomVotes(roomId: string) {
  const { data } = await gql<{ votes: any[] }>(
    `query($id: uuid!) { votes(where: {room_id: {_eq: $id}}, order_by: {round: asc}) { id room_id round voter_id target_id created_at } }`,
    { id: roomId },
  )
  return data?.votes ?? []
}

export async function listPublicPacks() {
  const { data } = await gql<{ word_packs: any[] }>(
    `query { word_packs(where: {is_public: {_eq: true}}, order_by: {likes: desc}, limit: 50) { id name description cover_url author_id is_public likes created_at profiles { nickname avatar_url } word_pairs { id pack_id civilian_word undercover_word difficulty category } } }`,
  )
  return data?.word_packs ?? []
}

export async function listMyPacks() {
  const uid = await currentUserId()
  if (!uid) return []
  const { data } = await gql<{ word_packs: any[] }>(
    `query($u: uuid!) { word_packs(where: {author_id: {_eq: $u}}, order_by: {created_at: desc}) { id name description cover_url author_id is_public likes created_at word_pairs { id civilian_word undercover_word difficulty category } } }`,
    { u: uid },
  )
  return data?.word_packs ?? []
}

export async function getPack(id: string) {
  const { data } = await gql<{ word_packs_by_pk: any }>(
    `query($id: uuid!) { word_packs_by_pk(id: $id) { id name description cover_url author_id is_public likes created_at profiles { nickname } word_pairs { id civilian_word undercover_word difficulty category } } }`,
    { id },
  )
  return data?.word_packs_by_pk ?? null
}

export async function listWordPairs(limit = 100) {
  const { data } = await gql<{ word_pairs: any[] }>(
    `query($n: Int!) { word_pairs(limit: $n) { id pack_id civilian_word undercover_word difficulty category } }`,
    { n: limit },
  )
  return (data?.word_pairs ?? []) as any[]
}

export async function createPack(name: string, description?: string, isPublic = false) {
  const uid = await currentUserId()
  if (!uid) throw new Error('请先登录')
  const { data, error } = await gql<{ insert_word_packs_one: any }>(
    `mutation($n: String!, $d: String, $a: uuid!, $p: Boolean!) { insert_word_packs_one(object: {name: $n, description: $d, author_id: $a, is_public: $p}) { id name } }`,
    { n: name, d: description ?? null, a: uid, p: isPublic },
  )
  if (error) throw new Error(error.message)
  return data?.insert_word_packs_one
}

export async function addPairs(packId: string, pairs: any[]) {
  const rows = pairs
    .filter((p) => p.civilian_word?.trim() && p.undercover_word?.trim())
    .map((p) => ({
      pack_id: packId,
      civilian_word: p.civilian_word.trim(),
      undercover_word: p.undercover_word.trim(),
      difficulty: p.difficulty,
      category: p.category ?? null,
    }))
  if (!rows.length) return
  const { error } = await gql(
    `mutation($objs: [word_pairs_insert_input!]!) { insert_word_pairs(objects: $objs) { affected_rows } }`,
    { objs: rows },
  )
  if (error) throw new Error(error.message)
}

export async function deletePair(id: string) {
  await gql(`mutation($id: uuid!) { delete_word_pairs_by_pk(id: $id) { id } }`, { id })
}

export async function likePack(id: string) {
  const { error } = await gql(`mutation($id: uuid!) { like_pack(args: {p_pack: $id}) { id } }`, { id })
  if (error) throw new Error(error.message)
}

export async function deletePack(id: string) {
  await gql(`mutation($id: uuid!) { delete_word_packs_by_pk(id: $id) { id } }`, { id })
}

export async function setPackPublic(id: string, isPublic = true) {
  const { error } = await gql(
    `mutation($id: uuid!, $p: Boolean!) { update_word_packs_by_pk(pk_columns: {id: $id}, _set: {is_public: $p}) { id } }`,
    { id, p: isPublic },
  )
  if (error) throw new Error(error.message)
}

export async function leaderboard(order: 'win_count' | 'level' | 'total_games' = 'win_count') {
  const { data } = await gql<{ profiles: any[] }>(
    `query($o: profiles_order_by!) { profiles(order_by: $o, limit: 20) { id nickname avatar_url level exp total_games win_count } }`,
    { o: { [order]: 'desc' } as any },
  )
  return data?.profiles ?? []
}

export async function listAchievements() {
  const { data } = await gql<{ achievements: any[] }>(`query { achievements { id name description icon condition } }`)
  return data?.achievements ?? []
}

export async function myAchievements() {
  const uid = await currentUserId()
  if (!uid) return []
  const { data } = await gql<{ user_achievements: any[] }>(
    `query($u: uuid!) { user_achievements(where: {user_id: {_eq: $u}}) { id user_id achievement_id unlocked_at achievements { id name description icon } } }`,
    { u: uid },
  )
  return data?.user_achievements ?? []
}

export async function myGameStats(uid: string) {
  const { data } = await gql<{ game_players: any[] }>(
    `query($u: uuid!) { game_players(where: {user_id: {_eq: $u}}) { id role is_winner votes_received } }`,
    { u: uid },
  )
  const rows = data?.game_players ?? []
  return {
    total: rows.length,
    wins: rows.filter((r: any) => r.is_winner).length,
    undercover: rows.filter((r: any) => r.role === 'undercover').length,
    undercoverWins: rows.filter((r: any) => r.role === 'undercover' && r.is_winner).length,
    votes: rows.reduce((s: number, r: any) => s + (r.votes_received || 0), 0),
  }
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

export async function recentGames(uid: string, limit = 8) {
  const { data } = await gql<{ game_players: any[] }>(
    `query($u: uuid!) { game_players(where: {user_id: {_eq: $u}}, limit: 30) { id game_id role word is_winner votes_received games { winner ended_at } } }`,
    { u: uid },
  )
  const rows = (data?.game_players ?? []) as RecentGame[]
  return rows
    .sort((a, b) => (b.games?.ended_at ?? '').localeCompare(a.games?.ended_at ?? ''))
    .slice(0, limit)
}
