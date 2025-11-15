"use client"
import { Button, Card, Flex, Form, Input, InputNumber, Table, Typography, message } from 'antd'
import type { FormListFieldData } from 'antd/es/form'
import { useRouter } from 'next/navigation'

type PackageItemFormValue = { name?: string; priceYuan?: number | null }
type NewPackageFormValues = {
  name: string
  priceYuan?: number
  coverImageUrl?: string
  storeCount?: number
  primaryStoreName?: string
  primaryStoreAddress?: string
  primaryStorePhone?: string
  remark?: string
  packageItems?: PackageItemFormValue[]
}

export default function NewPackagePage() {
  const [form] = Form.useForm<NewPackageFormValues>()
  const router = useRouter()

  const onFinish = async (values: NewPackageFormValues) => {
    const normalizedPrice = Number(values.priceYuan ?? 0)
    const remarkValue = (values.remark ?? '').trim()
    const body = {
      name: values.name,
      description: '',
      remark: remarkValue || null,
      priceYuan: normalizedPrice,
      originalPriceYuan: normalizedPrice,
      coverImageUrl: (values.coverImageUrl || '').trim() || null,
      cardNumber: null,
      goodsCodeType: 2,
      storeSourceId: null,
      useLink: null,
      validUntil: null,
      userPoints: 0,
      storeId: null,
      goodsId: null,
      storeCount: values.storeCount ?? undefined,
      primaryStoreName: values.primaryStoreName || null,
      primaryStoreAddress: values.primaryStoreAddress || null,
      primaryStorePhone: values.primaryStorePhone || null,
      packageItems: (values.packageItems || [])
        .map((item) => ({
          name: item.name,
          priceYuan: item.priceYuan ?? undefined,
        }))
        .filter((item) => item.name),
    }
    const res = await fetch('/api/packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({} as { message?: string }))
      message.error(d.message || '创建失败')
      return
    }
    const created = (await res.json()) as { id: string }
    message.success('创建成功')
    router.replace(`/admin/packages/${created.id}`)
  }

  return (
    <Flex justify="center" style={{ padding: 16 }}>
      <Card title="新建套餐" style={{ width: 900 }}>
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ priceYuan: 0 }}>
          <Form.Item name="name" label="商品标题" rules={[{ required: true, message: '请输入商品标题' }]}> 
            <Input placeholder="请输入商品标题" />
          </Form.Item>
          <Form.Item name="coverImageUrl" label="封面图地址">
            <Input placeholder="https://example.com/cover.jpg" />
          </Form.Item>
          <Form.Item name="priceYuan" label="价格(元)" rules={[{ required: true, message: '请输入价格' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="storeCount" label="适用门店数量">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="primaryStoreName" label="展示门店名称">
            <Input placeholder="例如：DT生活旗舰店（杭州滨江店）" />
          </Form.Item>
          <Form.Item name="primaryStoreAddress" label="展示门店地址">
            <Input placeholder="展示在订单详情中的门店地址" />
          </Form.Item>
          <Form.Item name="primaryStorePhone" label="展示门店电话">
            <Input placeholder="0571-XXXXXXX" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="例如：仅限2人使用；不含饮料" />
          </Form.Item>

          <Typography.Title level={5}>套餐信息列表</Typography.Title>
          <Form.List name="packageItems">
            {(fields, { add, remove }) => {
              const data = fields.map((field, index) => ({ ...field, index }))
              const columns = [
                {
                  title: '套餐名',
                  dataIndex: 'name',
                  render: (_value: unknown, record: FormListFieldData & { index: number }) => {
                    const field = fields[record.index]
                    return (
                      <Form.Item
                        name={[field.name, 'name']}
                        rules={[{ required: true, message: '请输入套餐名' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <Input placeholder="例如：牛排豪华套餐" />
                      </Form.Item>
                    )
                  },
                },
                {
                  title: '价格(元)',
                  dataIndex: 'price',
                  width: 160,
                  render: (_value: unknown, record: FormListFieldData & { index: number }) => {
                    const field = fields[record.index]
                    return (
                      <Form.Item name={[field.name, 'priceYuan']} style={{ marginBottom: 0 }}>
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                    )
                  },
                },
                {
                  title: '操作',
                  dataIndex: 'action',
                  width: 80,
                  render: (_value: unknown, record: FormListFieldData) => (
                    <Button type="link" danger onClick={() => remove(record.name)}>
                      删除
                    </Button>
                  ),
                },
              ]
              return (
                <>
                  <Table
                    rowKey="key"
                    dataSource={data}
                    columns={columns}
                    pagination={false}
                    locale={{ emptyText: '暂无数据' }}
                  />
                  <Button type="dashed" onClick={() => add()} block style={{ marginTop: 12 }}>
                    新增套餐项
                  </Button>
                </>
              )
            }}
          </Form.List>

          <Form.Item style={{ marginTop: 24 }}>
            <Button type="primary" htmlType="submit" block>
              保存
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </Flex>
  )
}
