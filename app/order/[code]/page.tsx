import { prisma } from '@/lib/prisma'
import OrderView from './OrderView'

type Props = { params: Promise<{ code: string }> }

export default async function OrderByCodePage({ params }: Props) {
  const { code } = await params
  const loginCode = decodeURIComponent(code)
  const c = await prisma.loginCode.findUnique({ where: { code: loginCode } })
  if (!c || !c.active || (c.expiresAt && c.expiresAt < new Date())) {
    return null
  }
  const pkg = await prisma.package.findUnique({ where: { id: c.packageId } })
  const unused = await prisma.stock.count({ where: { packageId: c.packageId, used: false } })
  return <OrderView loginCode={loginCode} pkg={pkg} unused={unused} />
}
