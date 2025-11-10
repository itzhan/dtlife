import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { readAdminSession } from '@/lib/auth'

type RouteContext = { params: Promise<{ stockId: string }> } | { params: { stockId: string } }

async function extractParams(context: RouteContext) {
  const resolved = 'params' in context ? context.params : undefined
  return (resolved instanceof Promise ? resolved : Promise.resolve(resolved)).then((p) => p ?? { stockId: '' })
}

const MAX_ATTEMPTS = 5
const CODE_LENGTH = 8
const CONFIGURED_SHARE_ORIGIN =
  process.env.NEXT_PUBLIC_SHARE_LINK_ORIGIN?.trim() || process.env.SHARE_LINK_ORIGIN?.trim() || ''

function buildShareLink(origin: string, code: string) {
  return `${origin}/bargain/order-detail?code=${encodeURIComponent(code)}`
}

function resolveShareOrigin(req: NextRequest) {
  if (CONFIGURED_SHARE_ORIGIN) {
    const trimmed = CONFIGURED_SHARE_ORIGIN.replace(/\/$/, '')
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed
    }
    try {
      const currentOrigin = new URL(req.nextUrl.origin)
      return `${currentOrigin.protocol}//${trimmed}`
    } catch {
      return `https://${trimmed}`
    }
  }
  return req.nextUrl.origin
}

function generateNumericCode() {
  let result = ''
  while (result.length < CODE_LENGTH) {
    result += crypto.randomInt(0, 10).toString()
  }
  return result
}

export async function POST(req: NextRequest, context: RouteContext) {
  const { stockId } = await extractParams(context)
  if (!stockId) return NextResponse.json({ message: '缺少 stockId' }, { status: 400 })
  const s = await readAdminSession()
  if (!s) return NextResponse.json({ message: '未认证' }, { status: 401 })

  const stock = await prisma.stock.findUnique({
    where: { id: stockId },
    include: { loginCodes: true },
  })
  if (!stock) return NextResponse.json({ message: '库存不存在' }, { status: 404 })

  const origin = resolveShareOrigin(req)
  let attempt = 0
  while (attempt < MAX_ATTEMPTS) {
    const code = generateNumericCode()
    try {
      const target = stock.loginCodes[0]
      let effectiveCode = code
      if (target) {
        const updated = await prisma.loginCode.update({
          where: { id: target.id },
          data: { code, active: true, shareLink: buildShareLink(origin, code) },
        })
        effectiveCode = updated.code
      } else {
        const created = await prisma.loginCode.create({
          data: {
            code,
            packageId: stock.packageId,
            active: true,
            stockId: stock.id,
            shareLink: buildShareLink(origin, code),
          },
        })
        effectiveCode = created.code
      }
      const link = buildShareLink(origin, effectiveCode)
      return NextResponse.json({ code: effectiveCode, link })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        attempt += 1
        continue
      }
      console.error(error)
      return NextResponse.json({ message: '生成失败' }, { status: 500 })
    }
  }
  return NextResponse.json({ message: '生成失败，请重试' }, { status: 500 })
}
