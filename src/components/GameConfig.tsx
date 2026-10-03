import { useEffect, useState } from 'react'
import { MaterialSwitch, GlassCheckbox } from './ui'
import { listPublicPacks } from '../lib/api'
import {
  ROLE_DESC,
  SPECIAL_ROLES,
  resolveUndercoverCount,
  roleLabel,
  rolePoolCounts,
  specialRolesFrom,
} from '../lib/game'
import { cn } from '../lib/utils'
import type { RoleName, RoomSettings } from '../types/db'

interface Pack {
  id: string
  name: string
  cats: string[]
}

interface Props {
  settings: RoomSettings
  onChange: (patch: Partial<RoomSettings>) => void
  /** 当前人数上限，用于计算角色配比与卧底上限 */
  playerCap: number
  disabled?: boolean
  showWordOptions?: boolean
}

function Stepper({
  value,
  min,
  max,
  onChange,
  disabled,
}: {
  value: number
  min: number
  max: number
  onChange: (v: number) => void
  disabled?: boolean
}) {
  const btn =
    'grid h-6 w-6 place-items-center rounded-lg border border-black/10 text-xs font-black disabled:opacity-40 dark:border-white/10'
  return (
    <span className="inline-flex items-center gap-1">
      <button type="button" className={btn} disabled={disabled || value <= min} onClick={() => onChange(value - 1)}>
        −
      </button>
      <span className="w-5 text-center text-sm font-bold">{value}</span>
      <button type="button" className={btn} disabled={disabled || value >= max} onClick={() => onChange(value + 1)}>
        ＋
      </button>
    </span>
  )
}

/** 通用玩法配置：简单（平民 vs 卧底 + 人数）/ 高级（自定义角色、顺序、词库、开关），创建与房间内共用 */
export default function GameConfig({ settings, onChange, playerCap, disabled, showWordOptions = true }: Props) {
  const cap = Math.max(2, playerCap)
  const specials = specialRolesFrom(settings)
  const [advanced, setAdvanced] = useState(specials.length > 0)
  const [packs, setPacks] = useState<Pack[]>([])

  const uc = resolveUndercoverCount(cap, settings)
  const pool = rolePoolCounts(cap, settings)
  const order = settings.speak_order ?? 'random'

  useEffect(() => {
    if (!showWordOptions) return
    let alive = true
    listPublicPacks().then((list) => {
      if (!alive) return
      setPacks(
        list.map((p) => ({
          id: p.id,
          name: p.name,
          cats: [...new Set((p.word_pairs ?? []).map((x) => x.category).filter(Boolean) as string[])],
        })),
      )
    })
    return () => {
      alive = false
    }
  }, [showWordOptions])

  const countOf = (r: RoleName) => specials.filter((x) => x === r).length
  const setRoleCount = (r: RoleName, c: number) => {
    const rest = specials.filter((x) => x !== r)
    onChange({ special_roles: [...rest, ...Array.from({ length: c }, () => r)] })
  }

  const chip = (active: boolean) =>
    cn(
      'rounded-full border px-3 py-1 text-xs font-bold transition',
      active
        ? 'border-brand-500 bg-brand-500/15 text-brand-600 dark:text-brand-300'
        : 'border-black/10 muted hover:border-brand-400 dark:border-white/10',
      disabled && 'pointer-events-none opacity-50',
    )

  const activePack = packs.find((p) => p.id === settings.word_pack_id)
  const cats = activePack?.cats ?? []
  const selCats = new Set(settings.categories ?? [])
  const toggleCat = (c: string) => {
    const n = new Set(selCats)
    if (n.has(c)) n.delete(c)
    else n.add(c)
    onChange({ categories: [...n] })
  }

  return (
    <div className="space-y-5">
      {/* 模式切换 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">玩法配置</span>
          <div className="flex rounded-xl border border-black/10 p-0.5 dark:border-white/10">
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                setAdvanced(false)
                onChange({ special_roles: [] })
              }}
              className={cn('rounded-lg px-3 py-1 text-xs font-bold transition', !advanced ? 'bg-brand-500 text-white' : 'muted')}
            >
              简单
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => setAdvanced(true)}
              className={cn('rounded-lg px-3 py-1 text-xs font-bold transition', advanced ? 'bg-brand-500 text-white' : 'muted')}
            >
              高级
            </button>
          </div>
        </div>
        <span className="text-xs muted">
          {advanced ? '全部规则自由调，人数够了就能开局' : '只玩平民 vs 卧底，最省心'}
        </span>
      </div>

      {/* 卧底人数 */}
      <div>
        <p className="mb-2 text-sm font-bold">卧底人数</p>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            className={chip(settings.undercover_count == null)}
            disabled={disabled}
            onClick={() => onChange({ undercover_count: null })}
          >
            自动
          </button>
          {Array.from({ length: cap - 1 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              className={chip(settings.undercover_count === n)}
              disabled={disabled}
              onClick={() => onChange({ undercover_count: n })}
            >
              {n} 名
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs muted">当前按 {cap} 人计算，将出现 {uc} 名卧底</p>
      </div>

      {/* 角色池预览 */}
      <div className="rounded-xl border border-black/5 bg-black/[0.02] p-3 dark:border-white/10 dark:bg-white/5">
        <p className="mb-2 text-xs font-bold muted">本局角色构成（按人数上限预估）</p>
        <div className="flex flex-wrap gap-1.5">
          {pool.map(({ role, count }) => (
            <span key={role} className="chip bg-brand-500/10 text-brand-600 dark:text-brand-300">
              {roleLabel(role)} ×{count}
            </span>
          ))}
        </div>
      </div>

      {/* 高级选项 */}
      {advanced && (
        <>
          <div>
            <p className="mb-2 text-sm font-bold">自定义角色</p>
            <p className="mb-3 text-xs muted">想加几个加几个，人数不够会在开局时自动补齐平民</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {SPECIAL_ROLES.map((r) => {
                const c = countOf(r)
                return (
                  <div key={r} className="rounded-xl border border-black/5 p-3 dark:border-white/10">
                    <div className="flex items-center justify-between gap-2">
                      <GlassCheckbox
                        disabled={disabled}
                        checked={c > 0}
                        onChange={(v) => setRoleCount(r, v ? 1 : 0)}
                        label={roleLabel(r)}
                      />
                      {c > 0 && (
                        <Stepper value={c} min={1} max={Math.max(1, cap - 1)} disabled={disabled} onChange={(n) => setRoleCount(r, n)} />
                      )}
                    </div>
                    <p className="mt-1 text-xs muted">{ROLE_DESC[r]}</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-bold">发言顺序</p>
            <div className="flex flex-wrap gap-1.5">
              {([
                ['random', '随机'],
                ['cw', '顺时针'],
                ['ccw', '逆时针'],
              ] as const).map(([v, label]) => (
                <button key={v} type="button" className={chip(order === v)} disabled={disabled} onClick={() => onChange({ speak_order: v })}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 词库 / 难度 */}
      {advanced && showWordOptions && (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-bold">词库</p>
            <select
              className="input-base"
              value={settings.word_pack_id ?? ''}
              disabled={disabled}
              onChange={(e) => onChange({ word_pack_id: e.target.value || null, categories: [] })}
            >
              <option value="">全部公开词库</option>
              {packs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {cats.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {cats.map((c) => (
                  <button key={c} type="button" className={chip(selCats.has(c))} disabled={disabled} onClick={() => toggleCat(c)}>
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="mb-2 text-sm font-bold">难度</p>
            <div className="flex flex-wrap gap-1.5">
              {[1, 2, 3, 4, 5].map((d) => (
                <button key={d} type="button" className={chip((settings.difficulty ?? 3) === d)} disabled={disabled} onClick={() => onChange({ difficulty: d })}>
                  {'★'.repeat(d)}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs muted">按最接近的难度抽词</p>
          </div>
        </div>
      )}

      {/* 开关 */}
      <div className="grid gap-3 sm:grid-cols-3">
        <MaterialSwitch checked={settings.enable_vote ?? true} onChange={(v) => onChange({ enable_vote: v })} label="投票器" disabled={disabled} />
        <MaterialSwitch checked={settings.enable_timer ?? true} onChange={(v) => onChange({ enable_timer: v })} label="发言计时" disabled={disabled} />
        <MaterialSwitch checked={settings.enable_review ?? true} onChange={(v) => onChange({ enable_review: v })} label="赛后复盘" disabled={disabled} />
      </div>
      {(settings.enable_vote ?? true) === false && (
        <p className="text-xs muted">已关闭投票器：发言结束后由房主手动决定出局者，适合随性局。</p>
      )}
    </div>
  )
}