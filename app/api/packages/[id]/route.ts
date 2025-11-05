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
  const body = await req.json().catch(() => null) as {
    name?: string
    description?: string | null
    priceCents?: number
    priceYuan?: number
    originalPriceCents?: number
    originalPriceYuan?: number
    coverImageUrl?: string | null
    cardNumber?: string | null
    goodsCodeType?: number
    storeSourceId?: number | null
    useLink?: string | null
    validUntil?: string | null
    userPoints?: number
    storeId?: string | null
    goodsId?: string | null
    storeCount?: number
    primaryStoreName?: string | null
    primaryStoreAddress?: string | null
    primaryStorePhone?: string | null
    storeDetails?: unknown
    packageItems?: unknown
  } | null
  if (!body) return NextResponse.json({ message: '请求体无效' }, { status: 400 })
  const data: Prisma.PackageUpdateInput = {}
  if (body.name) data.name = body.name
  if (body.description !== undefined) data.description = body.description ?? null
  const parseNumber = (value: unknown) => {
    const num = Number(value)
    return Number.isFinite(num) ? num : null
  }
  const parseString = (value: unknown) => {
    if (typeof value !== 'string') return null
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }
  const normalizeStoreDetails = (input: unknown): Prisma.JsonValue | null => {
    if (!Array.isArray(input)) return null
    const items = input
      .map((entry) => {
        const detail = entry as { name?: unknown; items?: unknown }
        const name = parseString(detail.name)
        const rawItems = Array.isArray(detail.items) ? detail.items : []
        const normalizedItems = rawItems
          .map((item) => parseString(item))
          .filter((item): item is string => Boolean(item))
        if (!name || normalizedItems.length === 0) return null
        return { name, items: normalizedItems }
      })
      .filter((entry): entry is { name: string; items: string[] } => Boolean(entry))
    return items.length > 0 ? items : null
  }
  const normalizePackageItems = (input: unknown): Prisma.JsonValue | null => {
    if (!Array.isArray(input)) return null
    const items = input
      .map((entry) => {
        const payload = entry as { name?: unknown; priceCents?: unknown; priceYuan?: unknown; items?: unknown }
        const name = parseString(payload.name)
        const price =
          parseNumber(payload.priceCents) ??
          (parseNumber(payload.priceYuan) != null ? Math.round(Number(payload.priceYuan) * 100) : null)
        if (!name) return null
        const detailItems = Array.isArray(payload.items)
          ? payload.items
              .map((item) => parseString(item))
              .filter((item): item is string => Boolean(item))
          : []
        return { name, priceCents: Math.max(0, price ?? 0), items: detailItems }
      })
      .filter((entry): entry is { name: string; priceCents: number; items: string[] } => Boolean(entry))
    return items.length > 0 ? items : null
  }

  if (body.priceCents !== undefined || body.priceYuan !== undefined) {
    const parsedFromCents = parseNumber(body.priceCents)
    const parsedFromYuan = parseNumber(body.priceYuan)
    const cents =
      parsedFromCents != null
        ? Math.round(parsedFromCents)
        : parsedFromYuan != null
          ? Math.round(parsedFromYuan * 100)
          : null
    if (cents != null) data.priceCents = Math.max(0, cents)
  }
  if (body.originalPriceCents !== undefined || body.originalPriceYuan !== undefined) {
    const parsedFromCents = parseNumber(body.originalPriceCents)
    const parsedFromYuan = parseNumber(body.originalPriceYuan)
    const cents =
      parsedFromCents != null
        ? Math.round(parsedFromCents)
        : parsedFromYuan != null
          ? Math.round(parsedFromYuan * 100)
          : null
    if (cents != null) data.originalPriceCents = Math.max(0, cents)
  }
  if (body.coverImageUrl !== undefined) data.coverImageUrl = parseString(body.coverImageUrl)
  if (body.cardNumber !== undefined) data.cardNumber = parseString(body.cardNumber)
  if (body.goodsCodeType !== undefined) {
    const parsed = parseNumber(body.goodsCodeType)
    if (parsed != null) data.goodsCodeType = Math.max(1, Math.trunc(parsed))
  }
  if (body.storeSourceId !== undefined) {
    const parsed = parseNumber(body.storeSourceId)
    data.storeSourceId = parsed != null ? Math.trunc(parsed) : null
  }
  if (body.useLink !== undefined) data.useLink = parseString(body.useLink)
  if (body.validUntil !== undefined) {
    if (typeof body.validUntil === 'string') {
      const d = new Date(body.validUntil)
      data.validUntil = Number.isNaN(d.valueOf()) ? null : d
    } else {
      data.validUntil = null
    }
  }
  if (body.userPoints !== undefined) {
    const parsed = parseNumber(body.userPoints)
    if (parsed != null) data.userPoints = Math.max(0, Math.trunc(parsed))
  }
  if (body.storeId !== undefined) data.storeId = parseString(body.storeId)
  if (body.goodsId !== undefined) data.goodsId = parseString(body.goodsId)
  if (body.storeCount !== undefined) {
    const parsed = parseNumber(body.storeCount)
    if (parsed != null) data.storeCount = Math.max(0, Math.trunc(parsed))
  }
  if (body.primaryStoreName !== undefined) data.primaryStoreName = parseString(body.primaryStoreName)
  if (body.primaryStoreAddress !== undefined) data.primaryStoreAddress = parseString(body.primaryStoreAddress)
  if (body.primaryStorePhone !== undefined) data.primaryStorePhone = parseString(body.primaryStorePhone)
  if (body.storeDetails !== undefined) {
    const normalized = normalizeStoreDetails(body.storeDetails)
    data.storeDetails = normalized
    // 如果前端未明确传 storeCount，则同步调整
    if (body.storeCount === undefined && normalized && Array.isArray(normalized)) {
      data.storeCount = normalized.length
    }
  }
  if (body.packageItems !== undefined) {
    data.packageItems = normalizePackageItems(body.packageItems)
  }
  const updated = await prisma.package.update({ where: { id }, data })
  return NextResponse.json(updated)
}
