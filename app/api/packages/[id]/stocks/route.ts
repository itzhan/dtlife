import { NextRequest, NextResponse } from 'next/server'
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
  const items = await prisma.stock.findMany({
    where: { packageId: id },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest, context: RouteContext) {
  const { id } = await extractParams(context)
  if (!id) return NextResponse.json({ message: '参数错误' }, { status: 400 })
  const s = await readAdminSession()
  if (!s) return NextResponse.json({ message: '未认证' }, { status: 401 })
  const payload = await req.json().catch(() => null) as { codes?: unknown } | null
  if (!Array.isArray(payload?.codes) || payload.codes.length === 0) {
    return NextResponse.json({ message: 'codes 必须为非空数组' }, { status: 400 })
  }
  const codesInput = payload.codes as unknown[]
  const filtered = Array.from(
    new Set(
      codesInput
        .map((c) => String(c ?? '').trim())
        .filter((c): c is string => c.length > 0)
    )
  )
  if (filtered.length === 0) return NextResponse.json({ message: '无有效核销码' }, { status: 400 })

  const operations = filtered.map((code) =>
    prisma.stock.create({ data: { code, packageId: id } })
  )
  let created = 0
  for (const op of operations) {
    try {
      await op
      created += 1
    } catch {
      // 唯一键冲突时忽略，让流程继续
    }
  }
  return NextResponse.json({ ok: true, created, requested: filtered.length })
}

