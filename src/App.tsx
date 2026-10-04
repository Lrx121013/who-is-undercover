import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { ToastProvider } from './hooks/useToast'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import PencilLoader from './components/ui/PencilLoader'
import CookieBanner from './components/CookieBanner'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import AuthCallback from './pages/AuthCallback'
import VerifyEmail from './pages/VerifyEmail'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Home from './pages/Home'
import Profile from './pages/Profile'
import Friends from './pages/Friends'
import FriendSearch from './pages/FriendSearch'
import FriendRequests from './pages/FriendRequests'
import Notifications from './pages/Notifications'
import Rooms from './pages/Rooms'
import CreateRoom from './pages/CreateRoom'
import JoinRoom from './pages/JoinRoom'
import RoomLobby from './pages/RoomLobby'
import Game from './pages/Game'
import Result from './pages/Result'
import WordPacks from './pages/WordPacks'
import WordPackDetail from './pages/WordPackDetail'
import WordPackCreate from './pages/WordPackCreate'
import Leaderboard from './pages/Leaderboard'
import Achievements from './pages/Achievements'
import Settings from './pages/Settings'

export default function App() {
  const [intro, setIntro] = useState(() => {
    try {
      return !sessionStorage.getItem('wiu_intro_seen')
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (!intro) return
    const t = setTimeout(() => {
      setIntro(false)
      try {
        sessionStorage.setItem('wiu_intro_seen', '1')
      } catch {
        /* ignore */
      }
    }, 2400)
    return () => clearTimeout(t)
  }, [intro])

  return (
    <>
    <ToastProvider>
      <AuthProvider>
        <Routes>
          {/* 公开页面 */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* 登录后页面 */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/home" element={<Home />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/friends/search" element={<FriendSearch />} />
            <Route path="/friends/requests" element={<FriendRequests />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/rooms/create" element={<CreateRoom />} />
            <Route path="/rooms/join" element={<JoinRoom />} />
            <Route path="/rooms/:code" element={<RoomLobby />} />
            <Route path="/rooms/:code/game" element={<Game />} />
            <Route path="/rooms/:code/result" element={<Result />} />
            <Route path="/word-packs" element={<WordPacks />} />
            <Route path="/word-packs/mine" element={<WordPacks />} />
            <Route path="/word-packs/:id" element={<WordPackDetail />} />
            <Route path="/word-packs/create" element={<WordPackCreate />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Landing />} />
        </Routes>
      </AuthProvider>
      </ToastProvider>
      {intro && <PencilLoader fullscreen text="正在洗牌，准备出题…" />}
      <CookieBanner />
    </>
  )
}
