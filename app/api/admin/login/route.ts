import { NextRequest, NextResponse } from 'next/server'
import { setAdminCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json().catch(() => ({}))
  const u = process.env.ADMIN_USER
  const p = process.env.ADMIN_PASS
  if (!u || !p) {
    return NextResponse.json({ message: '未配置管理员环境变量' }, { status: 500 })
  }
  if (username !== u || password !== p) {
    return NextResponse.json({ message: '用户名或密码错误' }, { status: 401 })
  }
  const now = Math.floor(Date.now() / 1000)
  await setAdminCookie({ user: u, iat: now, exp: now + 60 * 60 * 12 }) // 12 小时
  return NextResponse.json({ ok: true })
}
