import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../hooks/useToast'
import { PageHeader } from '../components/Layout'
import GameConfig from '../components/GameConfig'
import { ClockSelector, MaterialSwitch, FloatingInput, DoodleButton } from '../components/ui'
import { createRoom } from '../lib/api'
import { DEFAULT_SETTINGS } from '../lib/game'
import type { RoomSettings } from '../types/db'

const PLAYER_OPTIONS = [2, 3, 4, 5, 6, 8]
const TIME_OPTIONS = [15, 30, 45, 60, 90, 120]

/** 创建房间：时钟选人数/限时 + 密码 + 自由玩法配置 */
export default function CreateRoom() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [players, setPlayers] = useState(1) // index: 3 人
  const [time, setTime] = useState(3) // index: 60s
  const [settings, setSettings] = useState<RoomSettings>({ ...DEFAULT_SETTINGS })
  const [passwordRoom, setPasswordRoom] = useState(false)
  const [password, setPassword] = useState('')
  const [creating, setCreating] = useState(false)

  const patch = (p: Partial<RoomSettings>) => setSettings((s) => ({ ...s, ...p }))
  const maxPlayers = PLAYER_OPTIONS[players]
  const speakTime = TIME_OPTIONS[time]

  const submit = async () => {
    setCreating(true)
    try {
      const room = await createRoom(
        {
          ...settings,
          max_players: maxPlayers,
          speak_time: speakTime,
          password_room: passwordRoom,
        },
        passwordRoom ? password : undefined,
      )
      toast(`房间 ${room.room_code} 创建成功`, 'success')
      navigate(`/rooms/${room.room_code}`)
    } catch (e) {
      toast((e as Error).message, 'error')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader back title="创建房间" sub="配置一场属于你的卧底局，怎么玩你说了算" />

      <div className="grid gap-4 md:grid-cols-2">
        {/* 时钟选择器 */}
        <section className="glass-card flex flex-col items-center gap-6 p-6 md:flex-row md:justify-around">
          <ClockSelector options={PLAYER_OPTIONS} value={players} onChange={setPlayers} caption="房间人数" unit="人" />
          <ClockSelector options={TIME_OPTIONS} value={time} onChange={setTime} caption="发言限时" unit="s" />
        </section>

        {/* 密码房 */}
        <section className="glass-card space-y-4 p-6">
          <h2 className="text-sm font-black tracking-tight">🔒 房间访问</h2>
          <MaterialSwitch checked={passwordRoom} onChange={setPasswordRoom} label="密码房" />
          {passwordRoom && (
            <div>
              <FloatingInput label="房间密码" value={password} onChange={setPassword} maxLength={12} />
            </div>
          )}
          <p className="text-xs opacity-40">2 人即可开局，人数越多越热闹；角色与规则都可以自由搭配。</p>
        </section>
      </div>

      {/* 玩法配置 */}
      <section className="glass-card p-6">
        <GameConfig settings={settings} onChange={patch} playerCap={maxPlayers} />
      </section>

      <DoodleButton variant="C" onClick={submit} loading={creating} size="full">
        创建房间
      </DoodleButton>
    </div>
  )
}
