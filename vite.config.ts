import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import type { NextHandleFunction } from 'connect'

const MAILTRAP = 'https://send.api.mailtrap.io/api/send'

const sendVerificationDev: NextHandleFunction = (req, res, next) => {
  const url = req.url?.split('?')[0]
  if (url !== '/api/send-verification' || req.method !== 'POST') {
    next()
    return
  }
  let raw = ''
  req.on('data', (c: Buffer) => (raw += c.toString()))
  req.on('end', async () => {
    try {
      const { email, nickname, link } = JSON.parse(raw || '{}')
      const key = process.env.MAILTRAP_API_KEY
      res.setHeader('Content-Type', 'application/json')
      if (!key) {
        res.statusCode = 500
        res.end(JSON.stringify({ ok: false, error: 'missing MAILTRAP_API_KEY' }))
        return
      }
      const html = `<div style="font-family:'PingFang SC',sans-serif;max-width:560px;margin:0 auto;padding:32px 20px;background:#f6f7f4"><h1 style="font-size:20px">喂，${nickname || '玩家'}</h1><p>点击下面链接完成邮箱验证：</p><a href="${link}" style="display:inline-block;padding:12px 28px;background:#191a18;color:#fff;border-radius:8px;text-decoration:none">验证我的邮箱</a><p style="word-break:break-all;color:#888;font-size:12px">${link}</p></div>`
      const r = await fetch(MAILTRAP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Api-Token': key },
        body: JSON.stringify({
          from: { email: 'no-reply@wiu.app', name: 'WIU' },
          to: [{ email }],
          subject: '验证你的邮箱 · 谁是卧底',
          html,
          category: 'email verification',
        }),
      })
      const j = await r.json().catch(() => ({}))
      res.statusCode = r.ok ? 200 : 502
      res.end(JSON.stringify(r.ok ? { ok: true } : { ok: false, error: (j as any)?.message }))
    } catch (e: any) {
      res.setHeader('Content-Type', 'application/json')
      res.statusCode = 500
      res.end(JSON.stringify({ ok: false, error: e?.message }))
    }
  })
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'dev-send-verification',
      configureServer(server) {
        server.middlewares.use(sendVerificationDev)
      },
    },
  ],
  server: { port: 5173 },
})
