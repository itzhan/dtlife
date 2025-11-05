"use client"
import { Button, Card, Divider, Flex, Form, Input, InputNumber, Space, Typography, message } from 'antd'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'

type StoreDetailFormValue = { name?: string; items?: { value?: string }[] }
type PackageItemFormValue = { name?: string; priceYuan?: number; items?: { value?: string }[] }
type NewPackageFormValues = {
  name: string
  priceYuan?: number
  originalPriceYuan?: number
  coverImageUrl?: string
  storeCount?: number
  primaryStoreName?: string
  primaryStoreAddress?: string
  primaryStorePhone?: string
  storeDetails?: StoreDetailFormValue[]
  packageItems?: PackageItemFormValue[]
}

export default function NewPackagePage() {
  const [form] = Form.useForm<NewPackageFormValues>()
  const router = useRouter()

  const onFinish = async (values: NewPackageFormValues) => {
    const body = {
      name: values.name,
      description: '',
      priceYuan: values.priceYuan ?? 0,
      originalPriceYuan: values.originalPriceYuan ?? 0,
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
      storeDetails: (values.storeDetails || [])
        .map((detail) => ({
          name: detail.name,
          items: (detail.items || []).map((item) => item?.value).filter(Boolean),
        }))
        .filter((detail) => detail.name && detail.items && detail.items.length > 0),
      packageItems: (values.packageItems || [])
        .map((item) => ({
          name: item.name,
          priceYuan: item.priceYuan ?? 0,
          items: (item.items || []).map((sub) => sub?.value).filter(Boolean),
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
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ priceYuan: 0, originalPriceYuan: 0 }}>
          <Form.Item name="name" label="商品标题" rules={[{ required: true, message: '请输入商品标题' }]}> 
            <Input placeholder="请输入商品标题" />
          </Form.Item>
          <Form.Item name="coverImageUrl" label="封面图地址">
            <Input placeholder="https://example.com/cover.jpg" />
          </Form.Item>
          <Form.Item name="priceYuan" label="现价(元)">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="originalPriceYuan" label="原价(元)">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="storeCount" label="适用门店数量" tooltip="留空将根据下方门店列表自动计算">
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

          <Divider>适用门店套餐</Divider>
          <Form.List name="storeDetails">
            {(fields, { add, remove }) => (
              <Flex vertical gap={16}>
                {fields.map((field, index) => (
                  <Card
                    key={field.key}
                    size="small"
                    title={
                      <Space>
                        <span>套餐 {index + 1}</span>
                        <Button type="link" danger icon={<MinusCircleOutlined />} onClick={() => remove(field.name)}>
                          删除
                        </Button>
                      </Space>
                    }
                  >
                    <Form.Item label="名称" name={[field.name, 'name']} rules={[{ required: true, message: '请输入套餐名称' }]}>
                      <Input placeholder="例如：A套餐" />
                    </Form.Item>
                    <Typography.Text strong>套餐明细</Typography.Text>
                    <Form.List name={[field.name, 'items']}>
                      {(itemFields, itemHelpers) => (
                        <Flex vertical gap={8} style={{ marginTop: 8 }}>
                          {itemFields.map((itemField) => (
                            <Flex key={itemField.key} align="center" gap={8}>
                              <Form.Item
                                name={[itemField.name, 'value']}
                                rules={[{ required: true, message: '请输入明细内容' }]}
                                style={{ flex: 1, marginBottom: 0 }}
                              >
                                <Input placeholder="例如：鸡翅 / 汉堡 / 可乐" />
                              </Form.Item>
                              <Button
                                danger
                                type="link"
                                icon={<MinusCircleOutlined />}
                                onClick={() => itemHelpers.remove(itemField.name)}
                              >
                                删除
                              </Button>
                            </Flex>
                          ))}
                          <Button type="dashed" icon={<PlusOutlined />} onClick={() => itemHelpers.add()} block>
                            添加明细
                          </Button>
                        </Flex>
                      )}
                    </Form.List>
                  </Card>
                ))}
                <Button type="dashed" icon={<PlusOutlined />} onClick={() => add()} block>
                  新增适用套餐
                </Button>
              </Flex>
            )}
          </Form.List>

          <Divider>套餐信息列表</Divider>
          <Form.List name="packageItems">
            {(fields, { add, remove }) => (
              <Flex vertical gap={16}>
                {fields.map((field, index) => (
                  <Card
                    key={field.key}
                    size="small"
                    title={
                      <Space>
                        <span>套餐项 {index + 1}</span>
                        <Button type="link" danger icon={<MinusCircleOutlined />} onClick={() => remove(field.name)}>
                          删除
                        </Button>
                      </Space>
                    }
                  >
                    <Form.Item label="名称" name={[field.name, 'name']} rules={[{ required: true, message: '请输入名称' }]}>
                      <Input placeholder="例如：牛排豪华套餐" />
                    </Form.Item>
                    <Form.Item label="价格(元)" name={[field.name, 'priceYuan']}>
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Typography.Text strong>包含内容</Typography.Text>
                    <Form.List name={[field.name, 'items']}>
                      {(itemFields, itemHelpers) => (
                        <Flex vertical gap={8} style={{ marginTop: 8 }}>
                          {itemFields.map((itemField) => (
                            <Flex key={itemField.key} gap={8} align="center">
                              <Form.Item
                                name={[itemField.name, 'value']}
                                rules={[{ required: true, message: '请输入内容' }]}
                                style={{ flex: 1, marginBottom: 0 }}
                              >
                                <Input placeholder="例如：安格斯牛排（1份）" />
                              </Form.Item>
                              <Button
                                danger
                                type="link"
                                icon={<MinusCircleOutlined />}
                                onClick={() => itemHelpers.remove(itemField.name)}
                              >
                                删除
                              </Button>
                            </Flex>
                          ))}
                          <Button type="dashed" icon={<PlusOutlined />} onClick={() => itemHelpers.add()} block>
                            添加内容
                          </Button>
                        </Flex>
                      )}
                    </Form.List>
                  </Card>
                ))}
                <Button type="dashed" icon={<PlusOutlined />} onClick={() => add()} block>
                  新增套餐项
                </Button>
              </Flex>
            )}
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
