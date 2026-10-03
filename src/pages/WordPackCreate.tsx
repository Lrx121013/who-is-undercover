import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../hooks/useToast'
import { PageHeader } from '../components/Layout'
import {
  PerCharInput,
  FloatingInput,
  GlassCheckbox,
  StrokeCheckbox,
  MatrixLoader,
  DoodleButton,
  TakeOffButton,
} from '../components/ui'
import { addPairs, createPack } from '../lib/api'

interface PairRow {
  civilian: string
  undercover: string
  difficulty: number
}

const DIFFS = [1, 2, 3, 4, 5]

/** 创建词库：逐字命名 + 浮动标签词条 + 矩阵加载 + 保存/同步 */
export default function WordPackCreate() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [categories, setCategories] = useState<Set<string>>(new Set())
  const [rows, setRows] = useState<PairRow[]>([
    { civilian: '', undercover: '', difficulty: 3 },
    { civilian: '', undercover: '', difficulty: 3 },
  ])
  const [loading, setLoading] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

  const CATS = ['日常生活', '影视娱乐', '体育运动', '美食', '地理', '黑科技']

  /** 从 JSON 导入词对（兼容本应用「导出 JSON」的格式，也兼容 civilian_word 写法） */
  const importJson = async (file: File) => {
    try {
      const raw = JSON.parse(await file.text()) as unknown
      const obj = (Array.isArray(raw) ? { pairs: raw } : raw) as Record<string, unknown>
      const list = Array.isArray(obj.pairs) ? obj.pairs : []
      const parsed: PairRow[] = list
        .map((item) => {
          const p = item as Record<string, unknown>
          const diff = Number(p.difficulty)
          return {
            civilian: String(p.civilian ?? p.civilian_word ?? '').trim(),
            undercover: String(p.undercover ?? p.undercover_word ?? '').trim(),
            difficulty: diff >= 1 && diff <= 5 ? Math.round(diff) : 3,
          }
        })
        .filter((p) => p.civilian && p.undercover)
      if (parsed.length === 0) return toast('未找到有效词对，请检查 JSON 格式', 'error')
      if (typeof obj.name === 'string' && obj.name.trim()) setName(obj.name.trim().slice(0, 14))
      if (typeof obj.description === 'string') setDesc(obj.description.trim().slice(0, 40))
      setRows(parsed)
      toast(`已导入 ${parsed.length} 组词对`, 'success')
    } catch {
      toast('JSON 解析失败，请检查文件内容', 'error')
    }
  }

  const setRow = (i: number, patch: Partial<PairRow>) => {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  }

  const valid = rows.filter((r) => r.civilian.trim() && r.undercover.trim())

  const save = async (sync: boolean) => {
    if (name.trim().length < 2) return toast('先给词库起个名字', 'error')
    if (valid.length === 0) return toast('至少填写一组词对', 'error')
    setLoading(true)
    try {
      const pack = await createPack(name.trim(), desc.trim(), isPublic)
      await addPairs(
        pack.id,
        valid.map((r) => ({
          civilian_word: r.civilian,
          undercover_word: r.undercover,
          difficulty: r.difficulty,
          category: [...categories][0] ?? null,
        })),
      )
      toast(sync ? `已保存并同步「${pack.name}」到云端` : `已保存「${pack.name}」`, 'success')
      navigate('/word-packs/mine')
    } catch (e) {
      toast((e as Error).message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        back
        title="创建词库"
        sub="自建词库支持 JSON 导入导出，可申请公开"
        right={
          <div className="flex items-center gap-2">
            <DoodleButton variant="B" size="sm" onClick={() => importRef.current?.click()}>
              导入 JSON
            </DoodleButton>
            <input
              ref={importRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void importJson(f)
                e.target.value = ''
              }}
            />
          </div>
        }
      />

      <section className="panel p-6">
        <div className="flex flex-wrap items-end gap-6">
          <PerCharInput label="词库名称" value={name} onChange={setName} maxLength={14} />
          <FloatingInput label="简介" value={desc} onChange={setDesc} maxLength={40} required={false} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <GlassCheckbox checked={isPublic} onChange={setIsPublic} label="公开到市场" sub="其他人可见并点赞" />
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {CATS.map((c) => (
              <StrokeCheckbox
                key={c}
                checked={categories.has(c)}
                onChange={() =>
                  setCategories((s) => {
                    const n = new Set(s)
                    n.has(c) ? n.delete(c) : n.add(c)
                    return n
                  })
                }
                label={c}
                size={1}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="panel p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-title mb-0">✏️ 词对（{valid.length} 组有效）</h2>
          {loading && (
            <span className="flex items-center gap-2 text-xs muted">
              <MatrixLoader scale={0.5} /> 词条处理中…
            </span>
          )}
        </div>

        <div className="space-y-4">
          {rows.map((r, i) => (
            <div key={i} className="rounded-xl border border-black/5 p-4 dark:border-white/10">
              <div className="flex flex-wrap items-end gap-4">
                <FloatingInput
                  label="平民词"
                  value={r.civilian}
                  onChange={(v) => setRow(i, { civilian: v })}
                />
                <FloatingInput
                  label="卧底词"
                  value={r.undercover}
                  onChange={(v) => setRow(i, { undercover: v })}
                />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs muted">相似度</span>
                  {DIFFS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setRow(i, { difficulty: d })}
                      className={[
                        'rounded-lg px-2 py-1 text-xs font-bold transition',
                        r.difficulty === d
                          ? 'bg-brand-500 text-white'
                          : 'border border-black/10 dark:border-white/10',
                      ].join(' ')}
                    >
                      {d}★
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))}
                  className="text-xs font-bold text-rose-500 hover:underline"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <DoodleButton variant="B" size="sm" onClick={() => setRows((rs) => [...rs, { civilian: '', undercover: '', difficulty: 3 }])}>
            + 添加一组词
          </DoodleButton>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-5">
        <DoodleButton variant="C" onClick={() => save(false)} loading={loading}>
          保存词库
        </DoodleButton>
        <TakeOffButton
          label="保存并同步云端"
          sentLabel="已同步"
          onAction={() => save(true)}
        />
      </div>
    </div>
  )
}
