import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
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

type StoreDetailInput = { name?: unknown; items?: unknown }
type PackageItemInput = { name?: unknown; priceCents?: unknown; priceYuan?: unknown }

function parseString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }
  return null
}

function parseNumber(value: unknown): number | null {
  const num = Number(value)
  if (!Number.isFinite(num)) return null
  return num
}

function normalizeStoreDetails(input: unknown): Prisma.JsonValue | null {
  if (!Array.isArray(input)) return null

  const normalized = input
    .map((entry) => {
      const detail = entry as StoreDetailInput
      const name = parseString(detail.name)
      const rawItems = Array.isArray(detail.items) ? detail.items : []
      const items = rawItems
        .map((item) => parseString(item))
        .filter((item): item is string => Boolean(item))
      if (!name || items.length === 0) return null
      return { name, items }
    })
    .filter((item): item is { name: string; items: string[] } => Boolean(item))

  return normalized.length > 0 ? normalized : null
}

function normalizePackageItems(input: unknown): Prisma.JsonValue | null {
  if (!Array.isArray(input)) return null

  const normalized = input
    .map((entry) => {
      const payload = entry as PackageItemInput
      const name = parseString(payload.name)
      const price =
        parseNumber(payload.priceCents) ??
        (parseNumber(payload.priceYuan) != null
          ? Math.round(Number(payload.priceYuan) * 100)
          : null)
      if (!name) return null
      const priceCents = price != null ? Math.max(0, price) : null
      return { name, priceCents }
    })
    .filter((item): item is { name: string; priceCents: number | null } => Boolean(item))

  return normalized.length > 0 ? normalized : null
}

export async function POST(req: NextRequest) {
  const s = await readAdminSession()
  if (!s) return NextResponse.json({ message: '未认证' }, { status: 401 })
  const body = await req.json().catch(() => null) as {
    name?: string
    description?: string | null
    remark?: string | null
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
  if (!body?.name) return NextResponse.json({ message: 'name 必填' }, { status: 400 })
  const priceFromCents = parseNumber(body.priceCents)
  const priceFromYuan = parseNumber(body.priceYuan)
  const price = priceFromCents != null
    ? Math.round(priceFromCents)
    : priceFromYuan != null
      ? Math.round(priceFromYuan * 100)
      : 0
  const originalPriceFromCents = parseNumber(body.originalPriceCents)
  const originalPriceFromYuan = parseNumber(body.originalPriceYuan)
  const originalPrice =
    originalPriceFromCents != null
      ? Math.round(originalPriceFromCents)
      : originalPriceFromYuan != null
        ? Math.round(originalPriceFromYuan * 100)
        : 0
  const goodsCodeType = parseNumber(body.goodsCodeType)
  const storeSourceId = parseNumber(body.storeSourceId)
  const userPoints = parseNumber(body.userPoints)
  const storeCountInput = parseNumber(body.storeCount)
  const validUntil =
    body.validUntil != null && typeof body.validUntil === 'string'
      ? new Date(body.validUntil)
      : null
  const storeDetails = normalizeStoreDetails(body.storeDetails ?? null)
  const packageItems = normalizePackageItems(body.packageItems ?? null)
  const computedStoreCount =
    storeCountInput != null
      ? Math.max(0, Math.trunc(storeCountInput))
      : Array.isArray(storeDetails)
        ? storeDetails.length
        : 0

  const created = await prisma.package.create({
    data: {
      name: body.name,
      description: body.description ?? null,
      remark: parseString(body.remark),
      priceCents: Math.max(0, price),
      originalPriceCents: Math.max(0, originalPrice),
      coverImageUrl: parseString(body.coverImageUrl),
      cardNumber: parseString(body.cardNumber),
      goodsCodeType: goodsCodeType != null ? Math.max(1, Math.trunc(goodsCodeType)) : 2,
      storeSourceId: storeSourceId != null ? Math.trunc(storeSourceId) : null,
      useLink: parseString(body.useLink),
      validUntil: validUntil && !Number.isNaN(validUntil.valueOf()) ? validUntil : null,
      userPoints: userPoints != null ? Math.max(0, Math.trunc(userPoints)) : 0,
      storeId: parseString(body.storeId),
      goodsId: parseString(body.goodsId),
      storeCount: Math.max(0, computedStoreCount),
      primaryStoreName: parseString(body.primaryStoreName),
      primaryStoreAddress: parseString(body.primaryStoreAddress),
      primaryStorePhone: parseString(body.primaryStorePhone),
      storeDetails: storeDetails ?? Prisma.JsonNull,
      packageItems: packageItems ?? Prisma.JsonNull,
    } satisfies Prisma.PackageCreateInput,
  })
  return NextResponse.json(created)
}
