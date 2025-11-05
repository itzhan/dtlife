import { redirect } from 'next/navigation'

type Props = { params: Promise<{ code: string }> }

export default async function OrderByCodePage({ params }: Props) {
  const { code } = await params
  const loginCode = decodeURIComponent(code)
  redirect(`/bargain/order-detail?code=${encodeURIComponent(loginCode)}`)
}
