import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { readAdminSession } from '@/lib/auth'

type RouteContext = { params: Promise<{ id: string }> } | { params: { id: string } }

async function extractParams(context: RouteContext) {
  const resolved = 'params' in context ? context.params : undefined
  return (resolved instanceof Promise ? resolved : Promise.resolve(resolved)).then((p) => p ?? { id: '' })
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const { id } = await extractParams(context)
  if (!id) return NextResponse.json({ message: '参数错误' }, { status: 400 })
  const s = await readAdminSession()
  if (!s) return NextResponse.json({ message: '未认证' }, { status: 401 })
  const pkg = await prisma.package.findUnique({ where: { id } })
  if (!pkg) return NextResponse.json({ message: '未找到' }, { status: 404 })
  // 额外返回未使用库存数量
  const unused = await prisma.stock.count({ where: { packageId: pkg.id, used: false } })
  return NextResponse.json({ ...pkg, unusedStock: unused })
}

export async function PUT(req: NextRequest, context: RouteContext) {
  const { id } = await extractParams(context)
  if (!id) return NextResponse.json({ message: '参数错误' }, { status: 400 })
  const s = await readAdminSession()
  if (!s) return NextResponse.json({ message: '未认证' }, { status: 401 })
  const body = await req.json().catch(() => null) as { name?: string; description?: string | null; priceCents?: number } | null
  if (!body) return NextResponse.json({ message: '请求体无效' }, { status: 400 })
  const data: Prisma.PackageUpdateInput = {}
  if (body.name) data.name = body.name
  if (body.description !== undefined) data.description = body.description ?? null
  if (body.priceCents !== undefined) {
    const parsed = Number(body.priceCents)
    data.priceCents = Number.isFinite(parsed) ? Math.round(parsed) : 0
  }
  const updated = await prisma.package.update({ where: { id }, data })
  return NextResponse.json(updated)
}
