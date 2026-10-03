import { cn } from '../../lib/utils'
import './MatrixLoader.css'

interface Props {
  className?: string
  dark?: boolean
  scale?: number
}

/** 矩阵加载器（by Shoh2008）：验证码 / 词条加载，小巧神秘 */
export default function MatrixLoader({ className, dark = true, scale = 1 }: Props) {
  return (
    <div
      className={cn('matrix-scope', dark && 'matrix-scope--dark', 'inline-block', className)}
      style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}
    >
      <div className="loader" />
    </div>
  )
}
