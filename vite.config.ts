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
      const r = await fetch(MAILTRAP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          from: { email: 'hello@notifications.lrxweb.qzz.io', name: 'Mailtrap Test' },
          to: [{ email }],
          template_uuid: '79ec6862-399b-48f9-b699-1cab3a491708',
          template_variables: {
            name: nickname || '',
            link: link || '',
            verification_url: link || '',
            verification_link: link || '',
            verify_url: link || '',
            verify_link: link || '',
            url: link || '',
            magic_link: link || '',
          },
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
  server: { port: 80 },
})
