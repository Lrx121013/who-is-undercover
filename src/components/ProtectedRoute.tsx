import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import PencilLoader from './ui/PencilLoader'

/** 路由守卫：未登录跳登录页 */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) return <PencilLoader fullscreen text="加载中…" />
  if (!session) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  return <>{children}</>
}
