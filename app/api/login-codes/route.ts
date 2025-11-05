import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { readAdminSession } from '@/lib/auth'

type CreateLoginCodeBody = {
  code?: string
  packageId?: string
  expiresAt?: string
  active?: boolean
}

export async function GET() {
  const s = await readAdminSession()
  if (!s) return NextResponse.json({ message: '未认证' }, { status: 401 })
  const list = await prisma.loginCode.findMany({ orderBy: { createdAt: 'desc' }, take: 200 })
  return NextResponse.json(list)
}

export async function POST(req: NextRequest) {
  const s = await readAdminSession()
  if (!s) return NextResponse.json({ message: '未认证' }, { status: 401 })
  const body = await req.json().catch(() => null) as CreateLoginCodeBody | null
  if (!body?.code || !body.packageId) return NextResponse.json({ message: 'code 与 packageId 必填' }, { status: 400 })
  const data: Prisma.LoginCodeUncheckedCreateInput = {
    code: body.code.trim(),
    packageId: body.packageId,
    active: body.active ?? true,
  }
  if (body.expiresAt) data.expiresAt = new Date(body.expiresAt)
  try {
    const created = await prisma.loginCode.create({ data })
    return NextResponse.json(created)
  } catch {
    return NextResponse.json({ message: '创建失败（可能是重复code）' }, { status: 400 })
  }
}
