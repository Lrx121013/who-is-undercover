import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://cczlkqpcmaljrojxfznj.supabase.co'
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjemxrcXBjbWFsanJvanhmem5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwMjI2NjYsImV4cCI6MjEwNjU5ODY2Nn0.tGWMxaAHSEX3TY00xetM_rTzc0My3ljE2TLOEMMkJUw'

/**
 * 站点根 URL：
 * - 优先使用 VITE_SITE_URL（构建时硬编码的部署域名）
 * - 本地开发时 VITE_SITE_URL 通常也是 localhost，用 window.location.origin 即可
 */
export const siteUrl: string =
  import.meta.env.VITE_SITE_URL || window.location.origin

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})

export const hasSupabase = Boolean(supabaseUrl && supabaseAnonKey)
