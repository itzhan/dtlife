import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
  return NextResponse.json({
    code: c.code,
    package: { id: pkg.id, name: pkg.name, description: pkg.description, priceCents: pkg.priceCents },
    unusedStock: unused,
  })
}

