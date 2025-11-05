"use client"
import { Button, Card, Flex, Form, Input, message, Typography } from 'antd'
import { useRouter } from 'next/navigation'

type LoginCodeForm = { code: string }

export default function Home() {
  const [form] = Form.useForm<LoginCodeForm>()
  const router = useRouter()

  const onFinish = async (values: LoginCodeForm) => {
    const payload = { code: values.code }
    const res = await fetch('/api/user/open', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const data = await res.json().catch(() => ({} as { message?: string }))
    if (!res.ok) return message.error(data.message || '登录码无效')
    router.push(`/order/${encodeURIComponent(values.code)}`)
  }

  return (
    <Flex align="center" justify="center" style={{ minHeight: '70vh' }}>
      <Card title="请输入登录码" style={{ width: 420 }}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="code" label="登录码" rules={[{ required: true, message: '请输入登录码' }]}>
            <Input placeholder="例如：WELCOME-2025" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>进入</Button>
          </Form.Item>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            管理端：访问 /admin 创建登录码并绑定套餐
          </Typography.Paragraph>
        </Form>
      </Card>
    </Flex>
  )
}
