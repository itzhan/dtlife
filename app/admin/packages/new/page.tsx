"use client"
import { Button, Card, Flex, Form, Input, InputNumber, message } from 'antd'
import { useRouter } from 'next/navigation'

type NewPackageFormValues = { name: string; description?: string; priceYuan?: number }

export default function NewPackagePage() {
  const [form] = Form.useForm<NewPackageFormValues>()
  const router = useRouter()

  const onFinish = async (values: NewPackageFormValues) => {
    const body = {
      name: values.name,
      description: values.description || null,
      priceCents: Math.round(Number(values.priceYuan || 0) * 100),
    }
    const res = await fetch('/api/packages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) {
      const d = await res.json().catch(() => ({} as { message?: string }))
      message.error(d.message || '创建失败')
      return
    }
    const created = await res.json() as { id: string }
    message.success('创建成功')
    router.replace(`/admin/packages/${created.id}`)
  }

  return (
    <Flex justify="center" style={{ padding: 16 }}>
      <Card title="新建套餐" style={{ width: 720 }}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="name" label="套餐名称" rules={[{ required: true }]}>
            <Input placeholder="请输入套餐名称" />
          </Form.Item>
          <Form.Item name="description" label="套餐描述">
            <Input.TextArea rows={4} placeholder="可选" />
          </Form.Item>
          <Form.Item name="priceYuan" label="价格(元)" initialValue={0}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">保存</Button>
          </Form.Item>
        </Form>
      </Card>
    </Flex>
  )
}
