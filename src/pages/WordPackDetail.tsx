import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useToast } from '../hooks/useToast'
import { PageHeader, EmptyState } from '../components/Layout'
import { FolderCard, DoodleButton, StrokeCheckbox, GoBackButton } from '../components/ui'
import { getPack, likePack } from '../lib/api'
import { cn, copyText } from '../lib/utils'
import type { WordPack } from '../types/db'

/** 词库详情：3D 文件夹卡片点开看词 + 收藏 + 导出 JSON */
export default function WordPackDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [pack, setPack] = useState<WordPack | null>(null)
  const [loading, setLoading] = useState(true)
  const [fav, setFav] = useState(() => {
    try {
      return (JSON.parse(localStorage.getItem('fav-packs') || '[]') as string[]).includes(id)
    } catch {
      return false
    }
  })

  useEffect(() => {
    getPack(id).then((p) => {
      setPack(p)
      setLoading(false)
    })
  }, [id])

  const toggleFav = () => {
    try {
      const list = JSON.parse(localStorage.getItem('fav-packs') || '[]') as string[]
      const next = fav ? list.filter((x) => x !== id) : [...list, id]
      localStorage.setItem('fav-packs', JSON.stringify(next))
    } catch {
      /* noop */
    }
    setFav(!fav)
    toast(fav ? '已取消收藏' : '已收藏词库', 'success')
  }

  const exportJson = async () => {
    if (!pack) return
    const json = JSON.stringify(
      {
        name: pack.name,
        description: pack.description,
        pairs: (pack.word_pairs ?? []).map((p) => ({
          civilian: p.civilian_word,
          undercover: p.undercover_word,
          difficulty: p.difficulty,
          category: p.category,
        })),
      },
      null,
      2,
    )
    if (await copyText(json)) toast('词库 JSON 已复制到剪贴板', 'success')
    else toast('复制失败', 'error')
  }

  if (loading) return <EmptyState text="加载词库中…" />
  if (!pack) return <EmptyState text="词库不存在" action={<DoodleButton variant="B" size="sm" onClick={() => navigate('/word-packs')}>词库市场</DoodleButton>} />

  const pairs = pack.word_pairs ?? []

  return (
    <div className="space-y-5">
      <PageHeader
        back
        title={pack.name}
        sub={`${pairs.length} 组词 · ❤️ ${pack.likes} · 作者 ${pack.profiles?.nickname ?? '官方'}`}
        right={
          <div className="flex items-center gap-3">
            <StrokeCheckbox checked={fav} onChange={toggleFav} label="收藏词库" />
            <DoodleButton variant="A" size="sm" onClick={() => likePack(pack.id).then(() => toast('已点赞', 'success'))}>
              点赞
            </DoodleButton>
            <DoodleButton variant="B" size="sm" onClick={exportJson}>
              导出 JSON
            </DoodleButton>
          </div>
        }
      />

      <section className="panel p-6">
        <p className="mb-6 text-sm muted">{pack.description || '这个作者很懒，没写简介'}</p>
        <div className="flex flex-wrap items-start gap-8">
          {pairs.map((p, i) => (
            <FolderCard
              key={p.id}
              name={`#${i + 1}`}
              count={2}
              hint="点我对比"
              files={[
                { text: `平民：${p.civilian_word}`, tag: `${p.difficulty}★` },
                { text: `卧底：${p.undercover_word}`, tag: `${p.difficulty}★` },
              ]}
            />
          ))}
        </div>
      </section>

      <section className="panel p-6">
        <h2 className="section-title">📋 全部词对</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs muted">
                <th className="pb-2">#</th>
                <th className="pb-2">平民词</th>
                <th className="pb-2">卧底词</th>
                <th className="pb-2">相似度</th>
                <th className="pb-2">分类</th>
              </tr>
            </thead>
            <tbody>
              {pairs.map((p, i) => (
                <tr key={p.id} className="border-t border-black/5 dark:border-white/10">
                  <td className="py-2 muted">{i + 1}</td>
                  <td className="py-2 font-bold">{p.civilian_word}</td>
                  <td className="py-2 font-bold text-rose-500">{p.undercover_word}</td>
                  <td className={cn('py-2', p.difficulty >= 4 ? 'text-rose-500' : p.difficulty <= 2 ? 'text-emerald-500' : '')}>
                    {'★'.repeat(p.difficulty)}
                  </td>
                  <td className="py-2 muted">{p.category || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <GoBackButton onClick={() => navigate('/word-packs')} />
    </div>
  )
}
