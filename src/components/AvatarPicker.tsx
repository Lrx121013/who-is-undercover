import { useRef } from 'react'
import { cn, presetAvatars } from '../lib/utils'
import { DashSpinLoader } from './ui'

interface Props {
  /** 当前展示的图片地址（文件预览 / 已选头像 / 默认首字母头像） */
  preview: string
  /** 是否已选中任一自定义头像（用于高亮「恢复默认」） */
  customized: boolean
  onFile: (file: File) => void
  onPreset: (url: string) => void
  onClear: () => void
  uploading?: boolean
}

/** 头像选择器：上传图片 + 一键预设 + 恢复默认 */
export default function AvatarPicker({
  preview,
  customized,
  onFile,
  onPreset,
  onClear,
  uploading = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const presets = presetAvatars()

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <img
            src={preview}
            alt="头像预览"
            className="h-20 w-20 rounded-2xl object-cover shadow-lg"
          />
          {uploading && (
            <span className="absolute inset-0 grid place-items-center rounded-2xl bg-black/50">
              <DashSpinLoader size={22} color="#fff" />
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-xl border border-black/15 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
          >
            上传图片
          </button>
          <button
            type="button"
            onClick={onClear}
            disabled={!customized}
            className="text-xs font-bold text-rose-500 underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
          >
            恢复默认头像
          </button>
          <span className="text-[11px] muted">JPG / PNG / GIF，≤ 2MB</span>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onFile(f)
            e.target.value = ''
          }}
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-bold muted">或选一个派对头像</p>
        <div className="grid grid-cols-6 gap-2">
          {presets.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onPreset(url)}
              className={cn(
                'overflow-hidden rounded-full ring-2 ring-transparent transition hover:scale-105',
                preview === url && 'ring-brand-500',
              )}
            >
              <img src={url} alt={`预设头像 ${i + 1}`} className="h-10 w-10 rounded-full" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}