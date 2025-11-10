import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { readAdminSession } from '@/lib/auth'

type RouteContext = { params: Promise<{ id: string }> } | { params: { id: string } }

async function extractParams(context: RouteContext) {
  const resolved = 'params' in context ? context.params : undefined
  return (resolved instanceof Promise ? resolved : Promise.resolve(resolved)).then((p) => p ?? { id: '' })
}

const parseValidDate = (value: unknown) => {
  if (!value) return null
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const date = new Date(trimmed)
  if (Number.isNaN(date.valueOf())) return null
  if (!trimmed.includes('T')) {
    date.setHours(23, 59, 59, 0)
  }
  return date
}

export async function GET(req: NextRequest, context: RouteContext) {
  const { id } = await extractParams(context)
  if (!id) return NextResponse.json({ message: '参数错误' }, { status: 400 })
  const s = await readAdminSession()
  if (!s) return NextResponse.json({ message: '未认证' }, { status: 401 })
  const items = await prisma.stock.findMany({
    where: { packageId: id },
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { loginCodes: true },
  })
  const shaped = items.map((item) => {
    const { loginCodes, ...rest } = item
    const shareCode = loginCodes[0]?.code ?? null
    const shareLink =
      loginCodes[0]?.shareLink ??
      (shareCode ? `${req.nextUrl.origin}/bargain/order-detail?code=${encodeURIComponent(shareCode)}` : null)
    return { ...rest, shareCode, shareLink }
  })
  return NextResponse.json(shaped)
}

export async function POST(req: NextRequest, context: RouteContext) {
  const { id } = await extractParams(context)
  if (!id) return NextResponse.json({ message: '参数错误' }, { status: 400 })
  const s = await readAdminSession()
  if (!s) return NextResponse.json({ message: '未认证' }, { status: 401 })
  const payload = await req.json().catch(() => null) as { codes?: unknown; entries?: { code?: unknown; validDate?: unknown }[] } | null
  let targets: { code: string; validUntil: Date | null }[] = []
  if (Array.isArray(payload?.entries) && payload.entries.length > 0) {
    targets = payload.entries
      .map((entry) => ({
        code: typeof entry.code === 'string' ? entry.code.trim() : '',
        validUntil: parseValidDate(entry.validDate),
      }))
      .filter((entry) => entry.code.length > 0)
  } else if (Array.isArray(payload?.codes)) {
    const codesInput = payload.codes as unknown[]
    const filtered = Array.from(
      new Set(
        codesInput
          .map((c) => String(c ?? '').trim())
          .filter((c): c is string => c.length > 0)
      )
    )
    targets = filtered.map((code) => ({ code, validUntil: null }))
  }

  if (targets.length === 0) return NextResponse.json({ message: '无有效核销码' }, { status: 400 })

  const operations = targets.map(({ code, validUntil }) =>
    prisma.stock.create({
      data: {
        code,
        validUntil: validUntil ?? undefined,
        package: { connect: { id } },
      },
    })
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
  return NextResponse.json({ ok: true, created, requested: targets.length })
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const { id } = await extractParams(context)
  if (!id) return NextResponse.json({ message: '参数错误' }, { status: 400 })
  const s = await readAdminSession()
  if (!s) return NextResponse.json({ message: '未认证' }, { status: 401 })

  const stockId = req.nextUrl.searchParams.get('stockId') || ((await req.json().catch(() => null)) as { stockId?: string } | null)?.stockId
  if (!stockId) return NextResponse.json({ message: '缺少 stockId' }, { status: 400 })

  const result = await prisma.stock.deleteMany({ where: { id: stockId, packageId: id } })
  if (result.count === 0) return NextResponse.json({ message: '库存不存在或已删除' }, { status: 404 })

  return NextResponse.json({ ok: true, deleted: result.count })
}
