import { NextRequest, NextResponse } from 'next/server'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { readAdminSession } from '@/lib/auth'

dayjs.extend(customParseFormat)

type RouteContext = { params: Promise<{ stockId: string }> } | { params: { stockId: string } }

async function extractParams(context: RouteContext) {
  const resolved = 'params' in context ? context.params : undefined
  return (resolved instanceof Promise ? resolved : Promise.resolve(resolved)).then((p) => p ?? { stockId: '' })
}

const parseValidDate = (value: unknown) => {
  if (value == null) return null
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = dayjs(trimmed, ['YYYY-MM-DD', 'YYYY/MM/DD'], true)
  if (parsed.isValid()) return parsed.endOf('day').toDate()
  const fallback = dayjs(trimmed)
  if (!fallback.isValid()) return null
  return fallback.endOf('day').toDate()
}

export async function PUT(req: NextRequest, context: RouteContext) {
  const { stockId } = await extractParams(context)
  if (!stockId) return NextResponse.json({ message: '缺少 stockId' }, { status: 400 })
  const s = await readAdminSession()
  if (!s) return NextResponse.json({ message: '未认证' }, { status: 401 })
  const body = await req.json().catch(() => null) as { code?: string; validDate?: string | null } | null
  if (!body) return NextResponse.json({ message: '请求体无效' }, { status: 400 })

  const data: Prisma.StockUpdateInput = {}
  if (body.code !== undefined) {
    const trimmed = body.code.trim()
    if (!trimmed) return NextResponse.json({ message: '核销码不能为空' }, { status: 400 })
    data.code = trimmed
  }
  if (body.validDate !== undefined) {
    const parsed = parseValidDate(body.validDate)
    data.validUntil = parsed
  }

  try {
    const updated = await prisma.stock.update({ where: { id: stockId }, data })
    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ message: '核销码重复' }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ message: '更新失败' }, { status: 500 })
  }
}
