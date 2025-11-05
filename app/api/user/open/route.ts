import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

type StoreDetail = { name: string; items: string[] }
type PackageItem = { name: string; priceCents: number; items: string[] }

function parseStoreDetails(input: Prisma.JsonValue | null): StoreDetail[] {
  if (!Array.isArray(input)) return []
  const result: StoreDetail[] = []
  for (const entry of input) {
    if (!entry || typeof entry !== 'object') continue
    const maybeRecord = entry as Record<string, unknown>
    const name = typeof maybeRecord.name === 'string' ? maybeRecord.name.trim() : ''
    if (!name) continue
    const itemsRaw = maybeRecord.items
    const items =
      Array.isArray(itemsRaw)
        ? itemsRaw
            .map((item) => (typeof item === 'string' ? item.trim() : null))
            .filter((item): item is string => Boolean(item))
        : []
    if (items.length === 0) continue
    result.push({ name, items })
  }
  return result
}

function parsePackageItems(input: Prisma.JsonValue | null): PackageItem[] {
  if (!Array.isArray(input)) return []
  const result: PackageItem[] = []
  for (const entry of input) {
    if (!entry || typeof entry !== 'object') continue
    const maybeRecord = entry as Record<string, unknown>
    const name = typeof maybeRecord.name === 'string' ? maybeRecord.name.trim() : ''
    if (!name) continue
    const priceRaw = Number(maybeRecord.priceCents)
    const price = Number.isFinite(priceRaw) ? Math.max(0, Math.round(priceRaw)) : 0
    const itemsRaw = maybeRecord.items
    const items =
      Array.isArray(itemsRaw)
        ? itemsRaw
            .map((item) => (typeof item === 'string' ? item.trim() : null))
            .filter((item): item is string => Boolean(item))
        : []
    result.push({ name, priceCents: price, items })
  }
  return result
}

// 用户提交登录码，返回绑定套餐的详情
export async function POST(req: NextRequest) {
  const { code } = await req.json().catch(() => ({}))
  if (!code) return NextResponse.json({ message: '登录码必填' }, { status: 400 })
  const now = new Date()
  const c = await prisma.loginCode.findUnique({ where: { code: String(code).trim() } })
  if (!c || !c.active || (c.expiresAt && c.expiresAt < now)) {
    return NextResponse.json({ message: '登录码无效或已过期' }, { status: 404 })
  }
  const pkg = await prisma.package.findUnique({ where: { id: c.packageId } })
  if (!pkg) return NextResponse.json({ message: '套餐不存在' }, { status: 404 })
  const unused = await prisma.stock.count({ where: { packageId: pkg.id, used: false } })
  const availableStock = await prisma.stock.findFirst({
    where: { packageId: pkg.id, used: false },
    orderBy: { createdAt: 'asc' },
  })
  const firstStock =
    availableStock ??
    (await prisma.stock.findFirst({ where: { packageId: pkg.id }, orderBy: { createdAt: 'asc' } }))
  const storeDetails = parseStoreDetails(pkg.storeDetails)
  const packageItems = parsePackageItems(pkg.packageItems)
  const storeCount = pkg.storeCount > 0 ? pkg.storeCount : storeDetails.length
  return NextResponse.json({
    code: c.code,
    orderNumber: c.orderNumber,
    package: {
      id: pkg.id,
      name: pkg.name,
      description: pkg.description,
      priceCents: pkg.priceCents,
      originalPriceCents: pkg.originalPriceCents,
      coverImageUrl: pkg.coverImageUrl,
      cardNumber: pkg.cardNumber,
      goodsCodeType: pkg.goodsCodeType,
      storeSourceId: pkg.storeSourceId,
      useLink: pkg.useLink,
      validUntil: pkg.validUntil ? pkg.validUntil.toISOString() : null,
      userPoints: pkg.userPoints,
      storeId: pkg.storeId,
      goodsId: pkg.goodsId,
      storeCount,
      primaryStoreName: pkg.primaryStoreName,
      primaryStoreAddress: pkg.primaryStoreAddress,
      primaryStorePhone: pkg.primaryStorePhone,
      storeDetails,
      packageItems,
    },
    unusedStock: unused,
    verificationCode: firstStock?.code ?? null,
  })
}
