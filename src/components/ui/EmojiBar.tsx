import { cn } from '../../lib/utils'
import './EmojiBar.css'

export interface Reaction {
  emoji: string
  tip: string
}

export const DEFAULT_REACTIONS: Reaction[] = [
  { emoji: '👍', tip: 'Like 点赞' },
  { emoji: '👏🏻', tip: 'Cheer 喝彩' },
  { emoji: '🎉', tip: 'Celebrate 庆祝' },
  { emoji: '✨', tip: 'Appreciate 欣赏' },
  { emoji: '🙂', tip: 'Smile 微笑' },
]

interface Props {
  reactions?: Reaction[]
  onSelect?: (emoji: string) => void
  className?: string
}

/** Emoji 反应栏（by Mayurwaghgpr · Tailwind）：房间互动 / 结算互动 */
export default function EmojiBar({
  reactions = DEFAULT_REACTIONS,
  onSelect,
  className,
}: Props) {
  return (
    <div
      className={cn(
        'hover:scale-x-105 transition-all duration-300 *:transition-all *:duration-300 flex justify-start text-2xl items-center shadow-xl z-10 bg-[#e8e4df] dark:bg-[#191818] gap-2 p-2 rounded-full',
        className,
      )}
    >
      {reactions.map((r) => (
        <button
          key={r.emoji}
          type="button"
          className="emoji-btn relative before:hidden hover:before:flex before:justify-center before:items-center before:h-4 before:text-[.6rem] before:px-1 before:bg-black dark:before:bg-white dark:before:text-black before:text-white before:bg-opacity-50 before:-top-7 before:rounded-lg hover:-translate-y-5 cursor-pointer hover:scale-125 bg-white dark:bg-[#191818] rounded-full p-2 px-3"
          style={{ ['--tip' as string]: r.tip }}
          onClick={() => onSelect?.(r.emoji)}
        >
          {r.emoji}
        </button>
      ))}
    </div>
  )
}
