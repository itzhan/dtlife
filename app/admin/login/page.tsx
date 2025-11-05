"use client"
import { Button, Card, Flex, Form, Input, message, Typography } from 'antd'
import { useRouter } from 'next/navigation'

type LoginFormValues = { username: string; password: string }

export default function AdminLoginPage() {
  const router = useRouter()
  const [form] = Form.useForm<LoginFormValues>()

  const onFinish = async (values: LoginFormValues) => {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    if (res.ok) {
      message.success('登录成功')
      router.replace('/admin')
      return
    }
    const data = await res.json().catch(() => ({} as { message?: string }))
    message.error(data.message || '登录失败')
  }

  return (
    <Flex align="center" justify="center" style={{ minHeight: '70vh' }}>
      <Card title="管理端登录" style={{ width: 360 }}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
            <Input placeholder="请输入管理员用户名" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true }]}>
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              登录
            </Button>
          </Form.Item>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            通过环境变量 ADMIN_USER / ADMIN_PASS 设置默认管理员
          </Typography.Paragraph>
        </Form>
      </Card>
    </Flex>
  )
}
