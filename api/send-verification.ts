/**
 * Vercel serverless：把注册时的验证链接邮件发到用户邮箱。
 * 本地 dev 由 vite.config.ts 中间件处理（两处逻辑保持一致）。
 * Mailtrap Send API：POST https://send.api.mailtrap.io/api/send
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ ok: false, error: 'method not allowed' }))
    return
  }
  let body: any = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      body = {}
    }
  }
  const { email, nickname, link } = body ?? {}
  const key = process.env.MAILTRAP_API_KEY
  if (!key) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ ok: false, error: 'missing MAILTRAP_API_KEY' }))
    return
  }
  try {
    const r = await fetch('https://send.api.mailtrap.io/api/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
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
    if (!r.ok) {
      res.statusCode = 502
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ ok: false, error: j?.message || 'mail send failed' }))
      return
    }
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ ok: true }))
  } catch (e: any) {
    res.statusCode = 502
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ ok: false, error: e?.message }))
  }
}

function escapeHtml(s: string) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}
