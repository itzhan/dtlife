"use client"
import { useCallback, useEffect, useState } from 'react'
import { Button, Card, DatePicker, Flex, Form, Input, Select, Table, Tag, message } from 'antd'
import type { TableProps } from 'antd'
import dayjs from 'dayjs'

type LoginCode = { id: string; code: string; packageId: string; active: boolean; expiresAt?: string | null; createdAt: string; orderNumber?: string | null }
type Package = { id: string; name: string }
type CreateFormValues = { code: string; packageId: string; active?: boolean; expiresAt?: dayjs.Dayjs; orderNumber?: string }

export default function LoginCodesPage() {
  const [list, setList] = useState<LoginCode[]>([])
  const [pkgs, setPkgs] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [form] = Form.useForm<CreateFormValues>()

  const load = useCallback(async (withSpinner = true) => {
    if (withSpinner) setLoading(true)
    try {
      const [codesRes, packagesRes] = await Promise.all([fetch('/api/login-codes'), fetch('/api/packages')])
      if (packagesRes.ok) setPkgs(await packagesRes.json() as Package[])
      if (codesRes.ok) setList(await codesRes.json() as LoginCode[])
    } catch (error) {
      console.error(error)
      message.error('加载登录码失败')
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { void load(false) }, [load])

  const onCreate = async (values: CreateFormValues) => {
    const payload: Record<string, unknown> = {
      code: values.code,
      packageId: values.packageId,
      active: values.active ?? true,
    }
    if (values.expiresAt) payload.expiresAt = values.expiresAt.toISOString()
    if (values.orderNumber) payload.orderNumber = values.orderNumber.trim()
    const res = await fetch('/api/login-codes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const data = await res.json().catch(() => ({} as { message?: string }))
    if (!res.ok) return message.error(data.message || '创建失败')
    message.success('已创建')
    form.resetFields()
    void load()
  }

  const columns: TableProps<LoginCode>['columns'] = [
    { title: '登录码', dataIndex: 'code' },
    { title: '套餐ID', dataIndex: 'packageId' },
    { title: '订单号', dataIndex: 'orderNumber', render: (value: string | null | undefined) => value || '-' },
    { title: '状态', dataIndex: 'active', render: (value: boolean) => value ? <Tag color="green">启用</Tag> : <Tag>停用</Tag> },
    { title: '过期时间', dataIndex: 'expiresAt', render: (value: string | null | undefined) => value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-' },
    { title: '创建时间', dataIndex: 'createdAt', render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm') },
  ]

  return (
    <Flex vertical gap={16} style={{ padding: 16 }}>
      <Card title="创建登录码">
        <Form form={form} layout="inline" onFinish={onCreate}>
          <Form.Item name="code" label="登录码" rules={[{ required: true }]}> 
            <Input placeholder="例如：WELCOME-2025" style={{ width: 240 }} />
          </Form.Item>
          <Form.Item name="packageId" label="绑定套餐" rules={[{ required: true }]}> 
            <Select style={{ width: 260 }} placeholder="选择套餐" options={pkgs.map(p => ({ label: p.name, value: p.id }))} />
          </Form.Item>
          <Form.Item name="orderNumber" label="订单号">
            <Input placeholder="可选，用于展示订单信息" style={{ width: 220 }} />
          </Form.Item>
          <Form.Item name="expiresAt" label="过期时间">
            <DatePicker showTime />
          </Form.Item>
          <Form.Item name="active" label="状态" initialValue={true}>
            <Select style={{ width: 120 }} options={[{ label: '启用', value: true }, { label: '停用', value: false }]} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">创建</Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="登录码列表">
        <Table rowKey="id" loading={loading} dataSource={list} columns={columns} />
      </Card>
    </Flex>
  )
}
