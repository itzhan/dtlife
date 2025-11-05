"use client"
import { useCallback, useEffect, useState } from 'react'
import { Button, Card, Descriptions, Flex, Form, Input, InputNumber, List, message, Space, Typography } from 'antd'
import { useParams } from 'next/navigation'

type Pkg = { id: string; name: string; description?: string | null; priceCents: number; createdAt: string; unusedStock?: number }
type Stock = { id: string; code: string; used: boolean; createdAt: string; usedAt?: string | null }
type UpdateFormValues = { name: string; description?: string; priceYuan?: number }
type StockFormValues = { codes: string }

export default function PackageDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const [pkg, setPkg] = useState<Pkg | null>(null)
  const [stocks, setStocks] = useState<Stock[]>([])
  const [loading, setLoading] = useState(true)
  const [editForm] = Form.useForm<UpdateFormValues>()
  const [stockForm] = Form.useForm<StockFormValues>()

  const load = useCallback(async (withSpinner = true) => {
    if (!id) return
    if (withSpinner) setLoading(true)
    try {
      const [pkgRes, stocksRes] = await Promise.all([
        fetch(`/api/packages/${id}`),
        fetch(`/api/packages/${id}/stocks`),
      ])
      if (pkgRes.ok) {
        const pkgData = await pkgRes.json() as Pkg
        setPkg(pkgData)
        editForm.setFieldsValue({
          name: pkgData.name,
          description: pkgData.description ?? '',
          priceYuan: pkgData.priceCents / 100,
        })
      }
      if (stocksRes.ok) setStocks(await stocksRes.json() as Stock[])
    } catch (error) {
      console.error(error)
      message.error('加载套餐详情失败')
    } finally {
      setLoading(false)
    }
  }, [editForm, id])
  useEffect(() => { void load(false) }, [load])

  const onUpdate = async (values: UpdateFormValues) => {
    const body: Record<string, unknown> = {}
    if (values.name) body.name = values.name
    if (values.description !== undefined) body.description = values.description
    if (values.priceYuan !== undefined) body.priceCents = Math.round(Number(values.priceYuan) * 100)
    const res = await fetch(`/api/packages/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) {
      const d = await res.json().catch(() => ({} as { message?: string }))
      message.error(d.message || '更新失败')
      return
    }
    message.success('已保存')
    void load()
  }

  const onAddStocks = async (values: StockFormValues) => {
    const raw = values.codes || ''
    const codes = raw.split(/\r?\n|,|;|\s+/).map((s) => s.trim()).filter(Boolean)
    if (codes.length === 0) return message.warning('请填写至少一个核销码')
    const res = await fetch(`/api/packages/${id}/stocks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ codes }) })
    const data = await res.json().catch(() => ({} as { message?: string; requested?: number; created?: number }))
    if (!res.ok) return message.error(data.message || '添加失败')
    const requested = data.requested ?? codes.length
    const createdCount = data.created ?? 0
    message.success(`请求 ${requested} 条，新增成功 ${createdCount} 条`)
    stockForm.resetFields(['codes'])
    void load()
  }

  return (
    <Flex vertical gap={16} style={{ padding: 16 }}>
      <Typography.Title level={3} style={{ margin: 0 }}>套餐详情</Typography.Title>
      <Card loading={loading}>
        <Descriptions column={1} title={pkg?.name} extra={<span>未使用库存：{pkg?.unusedStock ?? '-'}</span>}>
          <Descriptions.Item label="套餐ID">{pkg?.id}</Descriptions.Item>
          <Descriptions.Item label="描述">{pkg?.description || '-'}</Descriptions.Item>
          <Descriptions.Item label="价格(元)">{pkg ? (pkg.priceCents / 100).toFixed(2) : '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{pkg ? new Date(pkg.createdAt).toLocaleString() : '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="编辑套餐">
        <Form form={editForm} layout="vertical" onFinish={onUpdate}>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="priceYuan" label="价格(元)">
            <InputNumber min={0} style={{ width: 200 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">保存</Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="添加库存（核销码）">
        <Form form={stockForm} layout="vertical" onFinish={onAddStocks}>
          <Form.Item name="codes" label="核销码（支持空格/逗号/分号/换行分隔）" rules={[{ required: true }]}>
            <Input.TextArea rows={4} placeholder="例如：\nABC-111\nXYZ-222\n..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">批量新增</Button>
              <Button onClick={() => stockForm.resetFields(['codes'])}>清空</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card title={`库存列表（最新 200 条）`}>
        <List
          bordered
          dataSource={stocks}
          renderItem={(it) => (
            <List.Item>
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <span>{it.code}</span>
                <span>{new Date(it.createdAt).toLocaleString()}</span>
              </Space>
            </List.Item>
          )}
        />
      </Card>
    </Flex>
  )
}
