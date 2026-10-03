import { cn } from '../../lib/utils'
import './UserProfileButton.css'

interface Props {
  name?: string
  avatarUrl?: string | null
  onClick?: () => void
  size?: 'md' | 'sm'
  right?: React.ReactNode
  className?: string
}

/** 用户资料按钮（by reglobby）：头像入口 / 查看好友资料 */
export default function UserProfileButton({
  name,
  avatarUrl,
  onClick,
  size = 'md',
  right,
  className,
}: Props) {
  const small = size === 'sm'
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('user-profile', small && 'user-profile--sm', className)}
    >
      <div className="user-profile-inner">
        {avatarUrl ? (
          <img className="user-profile__avatar" src={avatarUrl} alt="" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        )}
        {!small && <span className="text-sm">{name || '我的'}</span>}
        {!small && right}
      </div>
    </button>
  )
}
