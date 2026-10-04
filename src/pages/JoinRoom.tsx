import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../hooks/useToast'
import { PageHeader } from '../components/Layout'
import { FloatingInput, BrutalInput, DoodleButton } from '../components/ui'
import { getRoomByCode, joinRoom } from '../lib/api'

/** 加入房间：浮动标签输入 6 位房间号 */
export default function JoinRoom() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [needPwd, setNeedPwd] = useState(false)
  const [joining, setJoining] = useState(false)

  // 防抖查房间，别每击一键都打一次后端
  useEffect(() => {
    const c = code.trim()
    if (c.length < 4) {
      setNeedPwd(false)
      return
    }
    const t = setTimeout(async () => {
      const room = await getRoomByCode(c.toUpperCase())
      setNeedPwd(!!room?.password)
    }, 400)
    return () => clearTimeout(t)
  }, [code])

  const submit = async () => {
    if (code.trim().length < 4) {
      toast('请输入 6 位房间号', 'error')
      return
    }
    setJoining(true)
    try {
      await joinRoom(code, password)
      toast('加入成功', 'success')
      navigate(`/rooms/${code.trim().toUpperCase()}`)
    } catch (e) {
      toast((e as Error).message, 'error')
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader back title="加入房间" sub="输入好友分享的房间号" />
      <div className="glass-card mx-auto max-w-sm p-7" style={{ animation: 'scaleIn 0.5s cubic-bezier(0.22,1,0.36,1) both' }}>
        <FloatingInput
          label="6 位房间号"
          value={code}
          onChange={(v) => setCode(v.toUpperCase())}
          onEnter={submit}
          maxLength={6}
          full
        />
        {needPwd && (
          <div className="mt-6">
            <BrutalInput placeholder="房间密码" value={password} onChange={setPassword} full />
          </div>
        )}
        <div className="mt-8 flex justify-center">
          <DoodleButton variant="A" onClick={submit} loading={joining} size="full">
            加入房间
          </DoodleButton>
        </div>
        <p className="mt-4 text-center text-xs opacity-40">没有房间号？让好友在大厅分享房号或邀请链接</p>
      </div>
    </div>
  )
}
