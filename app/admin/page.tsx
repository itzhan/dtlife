"use client"
import { useCallback, useEffect, useState } from 'react'
import { Button, Card, Flex, Space, Table, Typography, message } from 'antd'
import type { TableProps } from 'antd'
import Link from 'next/link'

type Package = {
  id: string
  name: string
  description?: string | null
  priceCents: number
  createdAt: string
}

export default function AdminHome() {
  const [data, setData] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async (withSpinner = true) => {
    if (withSpinner) setLoading(true)
    try {
      const res = await fetch('/api/packages')
      if (!res.ok) {
        const d = await res.json().catch(() => ({} as { message?: string }))
        message.error(d.message || '加载失败')
        return
      }
      const list = await res.json() as Package[]
      setData(list)
    } catch (error) {
      console.error(error)
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchData(false) }, [fetchData])

  const columns: TableProps<Package>['columns'] = [
    { title: '名称', dataIndex: 'name', render: (value, record) => <Link href={`/admin/packages/${record.id}`}>{value}</Link> },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    { title: '价格(元)', dataIndex: 'priceCents', render: (value) => (value / 100).toFixed(2) },
    { title: '创建时间', dataIndex: 'createdAt', render: (value) => new Date(value).toLocaleString() },
  ]

  return (
    <Flex vertical gap={16} style={{ padding: 16 }}>
      <Flex align="center" justify="space-between">
        <Typography.Title level={3} style={{ margin: 0 }}>管理后台</Typography.Title>
        <Space>
          <Link href="/admin/login-codes"><Button>登录码管理</Button></Link>
          <Link href="/admin/packages/new"><Button type="primary">新建套餐</Button></Link>
        </Space>
      </Flex>
      <Card>
        <Table rowKey="id" dataSource={data} loading={loading} columns={columns} />
      </Card>
    </Flex>
  )
}
