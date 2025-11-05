import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { readAdminSession } from '@/lib/auth'

export async function GET() {
  const s = await readAdminSession()
  if (!s) return NextResponse.json({ message: '未认证' }, { status: 401 })
  const list = await prisma.package.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { stocks: true, loginCodes: true } } },
  })
  return NextResponse.json(list)
}

export async function POST(req: NextRequest) {
  const s = await readAdminSession()
  if (!s) return NextResponse.json({ message: '未认证' }, { status: 401 })
  const body = await req.json().catch(() => null) as { name?: string; description?: string | null; priceCents?: number } | null
  if (!body?.name) return NextResponse.json({ message: 'name 必填' }, { status: 400 })
  const priceRaw = Number(body.priceCents)
  const price = Number.isFinite(priceRaw) ? Math.round(priceRaw) : 0
  const created = await prisma.package.create({
    data: { name: body.name, description: body.description ?? null, priceCents: price } satisfies Prisma.PackageCreateInput,
  })
  return NextResponse.json(created)
}
