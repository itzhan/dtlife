"use client"
import { Card, Descriptions, Flex, Typography } from 'antd'

type Props = {
  loginCode: string
  pkg: { name: string | null; description: string | null; remark?: string | null; priceCents: number } | null
  unused: number
}

export default function OrderView({ loginCode, pkg, unused }: Props) {
  return (
    <Flex vertical gap={16} style={{ padding: 16 }}>
      <Typography.Title level={3} style={{ margin: 0 }}>订单详情</Typography.Title>
      <Card>
        <Descriptions title={pkg?.name || '—'} column={1}>
          <Descriptions.Item label="登录码">{loginCode}</Descriptions.Item>
          <Descriptions.Item label="套餐描述">{pkg?.description || '-'}</Descriptions.Item>
          <Descriptions.Item label="备注">{pkg?.remark || '-'}</Descriptions.Item>
          <Descriptions.Item label="套餐价格">{pkg ? (pkg.priceCents / 100).toFixed(2) : '-' } 元</Descriptions.Item>
          <Descriptions.Item label="可用库存（核销码）">{unused}</Descriptions.Item>
        </Descriptions>
      </Card>
    </Flex>
  )
}
