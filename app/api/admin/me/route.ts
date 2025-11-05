import { NextResponse } from 'next/server'
import { readAdminSession } from '@/lib/auth'

export async function GET() {
  const s = await readAdminSession()
  if (!s) return NextResponse.json({ authenticated: false }, { status: 401 })
  return NextResponse.json({ authenticated: true, user: s.user })
}
