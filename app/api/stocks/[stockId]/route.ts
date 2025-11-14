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

const parseSerialNumber = (value: unknown) => {
  if (value == null) return null
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num)) return null
  const intValue = Math.trunc(num)
  if (intValue <= 0) return null
  return intValue
}

export async function PUT(req: NextRequest, context: RouteContext) {
  const { stockId } = await extractParams(context)
  if (!stockId) return NextResponse.json({ message: '缺少 stockId' }, { status: 400 })
  const s = await readAdminSession()
  if (!s) return NextResponse.json({ message: '未认证' }, { status: 401 })
  const body = (await req.json().catch(() => null)) as {
    code?: string
    validDate?: string | null
    orderNumber?: string | null
    validDays?: number | null
    serialNumber?: number | null
    used?: boolean
  } | null
  if (!body) return NextResponse.json({ message: '请求体无效' }, { status: 400 })

  const existing = await prisma.stock.findUnique({ where: { id: stockId } })
  if (!existing) return NextResponse.json({ message: '库存不存在' }, { status: 404 })

  const data: Prisma.StockUpdateInput = {}
  if (body.code !== undefined) {
    const trimmed = body.code.trim()
    if (!trimmed) return NextResponse.json({ message: '核销码不能为空' }, { status: 400 })
    data.code = trimmed
  }
  let nextOrderNumber: string | null = existing.orderNumber ?? null
  if (body.orderNumber !== undefined) {
    const trimmed = (body.orderNumber ?? '').trim()
    if (!trimmed) {
      nextOrderNumber = null
      data.orderNumber = null
    } else {
      const parsedOrderNumber = parseOrderNumber(trimmed)
      if (!parsedOrderNumber) return NextResponse.json({ message: '订单号格式不正确', code: 'INVALID_ORDER_NUMBER' }, { status: 400 })
      nextOrderNumber = parsedOrderNumber
      data.orderNumber = parsedOrderNumber
    }
  }
  let nextValidDays: number | null = existing.validDays ?? null
  if (body.validDays !== undefined) {
    if (body.validDays === null) {
      nextValidDays = null
      data.validDays = null
    } else {
      const parsedValidDays = parseValidDays(body.validDays)
      if (parsedValidDays == null) return NextResponse.json({ message: '有效期天数格式不正确', code: 'INVALID_VALID_DAYS' }, { status: 400 })
      nextValidDays = parsedValidDays
      data.validDays = parsedValidDays
    }
  }
  if (body.serialNumber !== undefined) {
    const parsedSerial = parseSerialNumber(body.serialNumber)
    if (parsedSerial == null) return NextResponse.json({ message: '序号格式不正确', code: 'INVALID_SERIAL_NUMBER' }, { status: 400 })
    data.serialNumber = parsedSerial
  }
  if (body.validDate !== undefined) {
    const parsed = parseValidDate(body.validDate)
    data.validUntil = parsed
  } else if (body.orderNumber !== undefined || body.validDays !== undefined) {
    data.validUntil = deriveValidUntil(nextOrderNumber, nextValidDays)
  }
  if (body.used !== undefined) {
    const nextUsed = Boolean(body.used)
    data.used = nextUsed
    data.usedAt = nextUsed ? existing.usedAt ?? new Date() : null
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
