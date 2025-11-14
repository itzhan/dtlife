import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { prisma } from '@/lib/prisma'
import { readAdminSession } from '@/lib/auth'

dayjs.extend(customParseFormat)

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

const ORDER_PREFIX = '102'
const ORDER_NUMBER_DATE_LENGTH = 8
const ORDER_NUMBER_PATTERN = /^102\d{21}$/

const parseOrderNumber = (value: unknown) => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (!ORDER_NUMBER_PATTERN.test(trimmed)) return null
  const datePart = trimmed.slice(ORDER_PREFIX.length, ORDER_PREFIX.length + ORDER_NUMBER_DATE_LENGTH)
  const parsed = dayjs(datePart, 'YYYYMMDD', true)
  if (!parsed.isValid()) return null
  return trimmed
}

const parseValidDays = (value: unknown) => {
  if (value == null) return null
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num)) return null
  const intValue = Math.trunc(num)
  if (intValue <= 0) return null
  return intValue
}

const deriveValidUntil = (orderNumber: string | null, validDays: number | null, fallback: Date | null = null) => {
  if (orderNumber && validDays) {
    const datePart = orderNumber.slice(ORDER_PREFIX.length, ORDER_PREFIX.length + ORDER_NUMBER_DATE_LENGTH)
    const purchase = dayjs(datePart, 'YYYYMMDD', true)
    if (purchase.isValid()) {
      return purchase.add(validDays - 1, 'day').endOf('day').toDate()
    }
  }
  return fallback
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
  const payload = (await req.json().catch(() => null)) as
    | {
        codes?: unknown
        entries?: { code?: unknown; validDate?: unknown; orderNumber?: unknown; validDays?: unknown }[]
      }
    | null
  let targets: { code: string; validUntil: Date | null; orderNumber: string | null; validDays: number | null }[] = []
  if (Array.isArray(payload?.entries) && payload.entries.length > 0) {
    targets = payload.entries
      .map((entry) => {
        const code = typeof entry.code === 'string' ? entry.code.trim() : ''
        const orderNumber = parseOrderNumber(entry.orderNumber)
        const validDays = parseValidDays(entry.validDays)
        const fallbackDate = parseValidDate(entry.validDate)
        return {
          code,
          orderNumber,
          validDays,
          validUntil: deriveValidUntil(orderNumber, validDays, fallbackDate),
        }
      })
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
    targets = filtered.map((code) => ({ code, validUntil: null, orderNumber: null, validDays: null }))
  }

  if (targets.length === 0) return NextResponse.json({ message: '无有效核销码' }, { status: 400 })

  const [{ _max }, totalCount] = await Promise.all([
    prisma.stock.aggregate({
      where: { packageId: id },
      _max: { serialNumber: true },
    }),
    prisma.stock.count({ where: { packageId: id } }),
  ])
  let currentSerial = _max.serialNumber ?? totalCount

  let created = 0
  for (const { code, validUntil, orderNumber, validDays } of targets) {
    const nextSerial = currentSerial + 1
    try {
      await prisma.stock.create({
        data: {
          code,
          serialNumber: nextSerial,
          validUntil: validUntil ?? undefined,
          orderNumber: orderNumber ?? undefined,
          validDays: validDays ?? undefined,
          package: { connect: { id } },
        },
      })
      currentSerial = nextSerial
      created += 1
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        continue
      }
      throw error
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
