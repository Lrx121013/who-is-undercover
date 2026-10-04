import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { useToast } from '../hooks/useToast'
import { usePrefs } from '../hooks/usePrefs'
import { PageHeader } from '../components/Layout'
import {
  ThemeSwitch,
  ClToggleSwitch,
  GlassCheckbox,
  FloatingInput,
  DoodleButton,
} from '../components/ui'
import { updateProfile } from '../lib/api'
import { nhost } from '../lib/nhost'

/** 设置：主题开关 + 偏好开关组 + 玻璃拟态隐私多选 + 账号安全 */
export default function Settings() {
  const { profile: me, isGuest, session, refreshProfile, updatePassword, signOut } = useAuth()
  const { theme, toggle } = useTheme()
  const { prefs, setPref } = usePrefs()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [showOnline, setShowOnline] = useState((me?.show_online ?? true) !== false)
  const [pwd, setPwd] = useState('')
  const [pwd2, setPwd2] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    setShowOnline((me?.show_online ?? true) !== false)
  }, [me?.show_online])

  const savePrivacy = async () => {
    if (!me) return
    await updateProfile(me.id, { show_online: showOnline })
    await refreshProfile()
    toast('隐私与偏好已保存', 'success')
  }

  const changePwd = async () => {
    if (pwd.length < 6) return toast('新密码至少 6 位', 'error')
    if (pwd !== pwd2) return toast('两次输入不一致', 'error')
    try {
      await updatePassword(pwd)
      toast('密码已修改', 'success')
      setPwd('')
      setPwd2('')
    } catch (e) {
      toast((e as Error).message, 'error')
    }
  }

  const bindEmail = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) return toast('邮箱格式不正确', 'error')
    const { error } = await nhost.auth.changeEmail({ newEmail: email } as any)
    if (error) return toast(error.message, 'error')
    toast('绑定邮件已发送，验证后即可转正', 'success')
  }

  const sectionTitleCls = 'flex items-center gap-2 text-sm font-black tracking-tight'
  const sectionIconCls =
    'flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/15 to-violet-500/15 text-xs'

  return (
    <div className="space-y-5">
      <PageHeader title="设置" sub="偏好、隐私与账号安全" />

      <div
        className="grid gap-4 md:grid-cols-2"
        style={{ animation: 'fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both' }}
      >
        {/* 主题设置 */}
        <section className="glass-card p-6">
          <h2 className={sectionTitleCls}>
            <span className={sectionIconCls}>🌗</span>
            主题设置
          </h2>
          <div className="mt-4 flex items-center gap-4">
            <ThemeSwitch checked={theme === 'dark'} onChange={toggle} />
            <span className="text-sm opacity-50">
              {theme === 'dark' ? '深色模式（派对氛围）' : '浅色模式'}
            </span>
          </div>
        </section>

        {/* 通知与偏好 */}
        <section className="glass-card space-y-4 p-6">
          <h2 className={sectionTitleCls}>
            <span className={sectionIconCls}>🔔</span>
            通知与偏好
          </h2>
          <ClToggleSwitch checked={prefs.notify} onChange={(v) => setPref('notify', v)} label="接收站内通知" />
          <ClToggleSwitch checked={prefs.sound} onChange={(v) => setPref('sound', v)} label="游戏音效" />
          <ClToggleSwitch checked={prefs.vibrate} onChange={(v) => setPref('vibrate', v)} label="震动反馈" />
          <ClToggleSwitch
            checked={prefs.publicStats}
            onChange={(v) => setPref('publicStats', v)}
            label="战绩对好友可见"
          />
          <p className="text-xs opacity-40">以上偏好会保存在本机，改变即时生效</p>
        </section>
      </div>

      {/* 隐私设置 */}
      <section
        className="glass-card p-6"
        style={{ animation: 'fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) .1s both' }}
      >
        <h2 className={sectionTitleCls}>
          <span className={sectionIconCls}>🔒</span>
          隐私设置
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <GlassCheckbox
            checked={prefs.nicknameSearch}
            onChange={(v) => setPref('nicknameSearch', v)}
            label="允许昵称搜索"
          />
          <GlassCheckbox
            checked={prefs.emailSearch}
            onChange={(v) => setPref('emailSearch', v)}
            label="允许邮箱搜索"
          />
          <GlassCheckbox checked={showOnline} onChange={setShowOnline} label="显示在线状态" />
        </div>
        <div className="mt-5">
          <DoodleButton variant="C" size="sm" onClick={savePrivacy}>
            保存隐私设置
          </DoodleButton>
        </div>
      </section>

      {/* 账号安全 */}
      <section
        className="glass-card p-6"
        style={{ animation: 'fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) .2s both' }}
      >
        <h2 className={sectionTitleCls}>
          <span className={sectionIconCls}>🔑</span>
          账号安全
        </h2>

        {isGuest && (
          <div className="mt-5 rounded-xl border border-amber-300/30 bg-amber-400/10 p-4">
            <p className="text-sm font-bold text-amber-700 dark:text-amber-300">🎫 游客转正</p>
            <p className="mb-3 mt-1 text-xs opacity-50">绑定邮箱后，战绩与好友将保留</p>
            <div className="flex flex-wrap items-end gap-4">
              <FloatingInput label="绑定邮箱" type="email" value={email} onChange={setEmail} />
              <DoodleButton variant="A" size="sm" onClick={bindEmail}>
                绑定
              </DoodleButton>
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-end gap-4">
          <FloatingInput
            label="新密码"
            type="password"
            value={pwd}
            onChange={setPwd}
            autoComplete="new-password"
          />
          <FloatingInput
            label="确认新密码"
            type="password"
            value={pwd2}
            onChange={setPwd2}
            onEnter={changePwd}
            autoComplete="new-password"
          />
          <DoodleButton variant="B" onClick={changePwd}>
            修改密码
          </DoodleButton>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-black/5 pt-5 dark:border-white/10">
          <DoodleButton
            variant="A"
            size="sm"
            onClick={async () => {
              await signOut()
              navigate('/')
            }}
          >
            退出登录
          </DoodleButton>
          <span className="text-xs opacity-40">
            当前身份：{isGuest ? '游客' : session?.user?.email ?? me?.nickname}
          </span>
        </div>
      </section>
    </div>
  )
}
