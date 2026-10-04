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
  const html = `
    <div style="font-family:-apple-system,'PingFang SC',sans-serif;max-width:560px;margin:0 auto;padding:32px 20px;background:#f6f7f4">
      <h1 style="font-size:20px;margin:0 0 8px">喂，${escapeHtml(nickname || '玩家')}，欢迎进桌</h1>
      <p style="color:#555;line-height:1.7">下面这封邮箱是给你用来给账号“签个名”的：点一下验证链接，你的座位就正式准备好了。</p>
      <a href="${escapeHtml(link || '')}" style="display:inline-block;margin:24px 0;padding:12px 28px;background:#191a18;color:#fff;text-decoration:none;border-radius:8px;font-weight:700">验证我的邮箱</a>
      <p style="color:#999;font-size:12px">如果按钮没反应，复制这行到浏览器：<br/><span style="word-break:break-all">${escapeHtml(link || '')}</span></p>
      <p style="color:#bbb;font-size:12px;margin-top:24px">谁是卧底 · 派对主持系统</p>
    </div>`
  try {
    const r = await fetch('https://send.api.mailtrap.io/api/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Token': key,
      },
      body: JSON.stringify({
        from: { email: 'no-reply@wiu.app', name: 'WIU' },
        to: [{ email }],
        subject: '验证你的邮箱 · 谁是卧底',
        html,
        category: 'email verification',
        custom_variables: nickname ? { nickname: String(nickname) } : undefined,
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
