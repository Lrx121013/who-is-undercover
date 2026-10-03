import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { PageHeader } from '../components/Layout'
import { FolderCard, DoodleButton, GoBackButton } from '../components/ui'
import { listRooms, listMembers, joinRoom } from '../lib/api'
import type { Room, RoomMember } from '../types/db'

/** 房间列表：3D 文件夹卡片，点开看成员 */
export default function Rooms() {
  const { profile: me } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [rooms, setRooms] = useState<Room[]>([])
  const [members, setMembers] = useState<Record<string, RoomMember[]>>({})
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const list = await listRooms()
    setRooms(list.filter((r) => r.status === 'waiting'))
    setLoading(false)
    const map: Record<string, RoomMember[]> = {}
    await Promise.all(
      list.slice(0, 10).map(async (r) => {
        map[r.id] = await listMembers(r.id)
      }),
    )
    setMembers(map)
  }

  useEffect(() => {
    void load()
  }, [])

  const enter = async (room: Room) => {
    try {
      await joinRoom(room.room_code)
      toast(`已加入房间 ${room.room_code}`, 'success')
      navigate(`/rooms/${room.room_code}`)
    } catch (e) {
      toast((e as Error).message, 'error')
      void load()
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="房间大厅"
        sub="等待中的房间，点开卡片查看成员并加入"
        right={
          <div className="flex flex-wrap gap-2">
            <DoodleButton variant="C" onClick={() => navigate('/rooms/create')}>
              创建房间
            </DoodleButton>
            <DoodleButton variant="A" onClick={() => navigate('/rooms/join')}>
              加入房间
            </DoodleButton>
          </div>
        }
      />

      {loading ? (
        <div className="space-y-3">
          <div className="shimmer-bg h-24 rounded-2xl" />
          <div className="shimmer-bg h-24 rounded-2xl" />
          <div className="shimmer-bg h-24 rounded-2xl" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="panel flex flex-col items-center gap-4 py-14 text-center">
          <span className="text-5xl opacity-60">🎮</span>
          <p className="text-sm opacity-50">当前没有等待中的房间，创建一个吧</p>
          <DoodleButton variant="C" onClick={() => navigate('/rooms/create')}>
            创建房间
          </DoodleButton>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((r, i) => {
            const ms = members[r.id] ?? []
            return (
              <div key={r.id} className={`stagger-${(i % 6) + 1}`}>
                <FolderCard
                  name={`房间 ${r.room_code}`}
                  count={ms.length}
                  badge={r.host_id === me?.id ? '我主持' : `${ms.length}/${r.max_players} 人`}
                  files={ms.map((m) => ({
                    text: m.profiles?.nickname ?? '玩家',
                    tag: m.user_id === r.host_id ? '房主' : m.is_ready ? '已准备' : '未准备',
                  }))}
                  onSelect={() => enter(r)}
                />
              </div>
            )
          })}
        </div>
      )}

      <GoBackButton onClick={() => navigate('/home')} />
    </div>
  )
}
