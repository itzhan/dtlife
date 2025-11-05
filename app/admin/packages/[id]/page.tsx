"use client"
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { useCallback, useEffect, useState } from 'react'
import {
  Button,
  Card,
  DatePicker,
  Descriptions,
  Divider,
  Flex,
  Form,
  Input,
  InputNumber,
  List,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import type { TableProps } from 'antd'
import { useParams } from 'next/navigation'
import dayjs from 'dayjs'

type StoreDetail = { name: string; items: string[] }
type PackageItem = { name: string; priceCents: number; items: string[] }
type Pkg = {
  id: string
  name: string
  description?: string | null
  priceCents: number
  originalPriceCents: number
  coverImageUrl?: string | null
  cardNumber?: string | null
  goodsCodeType: number
  storeSourceId?: number | null
  useLink?: string | null
  validUntil?: string | null
  userPoints: number
  storeId?: string | null
  goodsId?: string | null
  storeCount: number
  primaryStoreName?: string | null
  primaryStoreAddress?: string | null
  primaryStorePhone?: string | null
  storeDetails?: StoreDetail[] | null
  packageItems?: PackageItem[] | null
  createdAt: string
  unusedStock?: number
}
type Stock = { id: string; code: string; used: boolean; createdAt: string; usedAt?: string | null }

type StoreDetailFormRow = { name?: string; items?: { value?: string }[] }
type PackageItemFormRow = { name?: string; priceYuan?: number; items?: { value?: string }[] }
type UpdateFormValues = {
  name: string
  description?: string
  priceYuan?: number
  originalPriceYuan?: number
  coverImageUrl?: string
  cardNumber?: string
  goodsCodeType?: number
  storeSourceId?: number | null
  useLink?: string
  validUntil?: dayjs.Dayjs | null
  userPoints?: number
  storeId?: string
  goodsId?: string
  storeCount?: number
  primaryStoreName?: string
  primaryStoreAddress?: string
  primaryStorePhone?: string
  storeDetails?: StoreDetailFormRow[]
  packageItems?: PackageItemFormRow[]
}
type StockFormValues = { codes: string }

export default function PackageDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const [pkg, setPkg] = useState<Pkg | null>(null)
  const [stocks, setStocks] = useState<Stock[]>([])
  const [loading, setLoading] = useState(true)
  const [editForm] = Form.useForm<UpdateFormValues>()
  const [stockForm] = Form.useForm<StockFormValues>()

  const load = useCallback(
    async (withSpinner = true) => {
      if (!id) return
      if (withSpinner) setLoading(true)
      try {
        const [pkgRes, stocksRes] = await Promise.all([fetch(`/api/packages/${id}`), fetch(`/api/packages/${id}/stocks`)])
        if (pkgRes.ok) {
          const pkgData = (await pkgRes.json()) as Pkg
          setPkg(pkgData)
          editForm.setFieldsValue({
            name: pkgData.name,
            description: pkgData.description ?? '',
            priceYuan: pkgData.priceCents / 100,
            originalPriceYuan: pkgData.originalPriceCents / 100,
            coverImageUrl: pkgData.coverImageUrl ?? '',
            cardNumber: pkgData.cardNumber ?? '',
            goodsCodeType: pkgData.goodsCodeType,
            storeSourceId: pkgData.storeSourceId ?? undefined,
            useLink: pkgData.useLink ?? '',
            validUntil: pkgData.validUntil ? dayjs(pkgData.validUntil) : null,
            userPoints: pkgData.userPoints,
            storeId: pkgData.storeId ?? '',
            goodsId: pkgData.goodsId ?? '',
            storeCount: pkgData.storeCount,
            primaryStoreName: pkgData.primaryStoreName ?? '',
            primaryStoreAddress: pkgData.primaryStoreAddress ?? '',
            primaryStorePhone: pkgData.primaryStorePhone ?? '',
            storeDetails: (pkgData.storeDetails ?? []).map((detail) => ({
              name: detail.name,
              items: (detail.items ?? []).map((item) => ({ value: item })),
            })),
            packageItems: (pkgData.packageItems ?? []).map((item) => ({
              name: item.name,
              priceYuan: item.priceCents / 100,
              items: (item.items ?? []).map((content) => ({ value: content })),
            })),
          })
        }
        if (stocksRes.ok) setStocks((await stocksRes.json()) as Stock[])
      } catch (error) {
        console.error(error)
        message.error('加载套餐详情失败')
      } finally {
        setLoading(false)
      }
    },
    [editForm, id]
  )

  useEffect(() => {
    void load(false)
  }, [load])

  const onUpdate = async (values: UpdateFormValues) => {
    const payload: Record<string, unknown> = {}
    payload.name = values.name
    payload.description = values.description ?? ''
    payload.priceYuan = Number(values.priceYuan ?? 0)
    payload.originalPriceYuan = Number(values.originalPriceYuan ?? 0)
    payload.coverImageUrl = values.coverImageUrl ?? null
    payload.cardNumber = values.cardNumber ?? null
    payload.goodsCodeType = values.goodsCodeType ?? 2
    payload.storeSourceId = values.storeSourceId ?? null
    payload.useLink = values.useLink ?? null
    payload.validUntil = values.validUntil ? values.validUntil.toISOString() : null
    payload.userPoints = Number(values.userPoints ?? 0)
    payload.storeId = values.storeId ?? null
    payload.goodsId = values.goodsId ?? null
    payload.storeCount = values.storeCount
    payload.primaryStoreName = values.primaryStoreName ?? null
    payload.primaryStoreAddress = values.primaryStoreAddress ?? null
    payload.primaryStorePhone = values.primaryStorePhone ?? null
    payload.storeDetails = (values.storeDetails ?? [])
      .map((detail) => ({
        name: detail.name,
        items: (detail.items ?? []).map((item) => item?.value).filter(Boolean),
      }))
      .filter((detail) => detail.name && detail.items && detail.items.length > 0)
    payload.packageItems = (values.packageItems ?? [])
      .map((item) => ({
        name: item.name,
        priceYuan: item.priceYuan ?? 0,
        items: (item.items ?? []).map((sub) => sub?.value).filter(Boolean),
      }))
      .filter((item) => item.name)

    const res = await fetch(`/api/packages/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
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
    const codes = raw
      .split(/\r?\n|,|;|\s+/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (codes.length === 0) return message.warning('请填写至少一个核销码')
    const res = await fetch(`/api/packages/${id}/stocks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codes }),
    })
    const data = await res.json().catch(() => ({} as { message?: string; requested?: number; created?: number }))
    if (!res.ok) return message.error(data.message || '添加失败')
    const requested = data.requested ?? codes.length
    const createdCount = data.created ?? 0
    message.success(`请求 ${requested} 条，新增成功 ${createdCount} 条`)
    stockForm.resetFields(['codes'])
    void load()
  }

  const storeDetailColumns: TableProps<StoreDetail>['columns'] = [
    { title: '套餐名称', dataIndex: 'name' },
    {
      title: '明细',
      dataIndex: 'items',
      render: (value: string[]) =>
        value?.length ? (
          <Space wrap>
            {value.map((item) => (
              <Tag key={item}>{item}</Tag>
            ))}
          </Space>
        ) : (
          '-'
        ),
    },
  ]

  const packageItemColumns: TableProps<PackageItem>['columns'] = [
    { title: '名称', dataIndex: 'name' },
    {
      title: '包含内容',
      dataIndex: 'items',
      render: (value: string[]) =>
        value?.length ? (
          <Space wrap>
            {value.map((item) => (
              <Tag key={item}>{item}</Tag>
            ))}
          </Space>
        ) : (
          '-'
        ),
    },
    {
      title: '价格(元)',
      dataIndex: 'priceCents',
      render: (value: number) => ((value ?? 0) / 100).toFixed(2),
    },
  ]

  return (
    <Flex vertical gap={16} style={{ padding: 16 }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        套餐详情
      </Typography.Title>
      <Card loading={loading}>
        <Descriptions column={1} title={pkg?.name} extra={<span>未使用库存：{pkg?.unusedStock ?? '-'}</span>}>
          <Descriptions.Item label="套餐ID">{pkg?.id}</Descriptions.Item>
          <Descriptions.Item label="描述">{pkg?.description || '-'}</Descriptions.Item>
          <Descriptions.Item label="现价(元)">{pkg ? (pkg.priceCents / 100).toFixed(2) : '-'}</Descriptions.Item>
          <Descriptions.Item label="原价(元)">{pkg ? (pkg.originalPriceCents / 100).toFixed(2) : '-'}</Descriptions.Item>
          <Descriptions.Item label="封面图">
            {pkg?.coverImageUrl ? (
              <a href={pkg.coverImageUrl} target="_blank" rel="noreferrer">
                查看封面
              </a>
            ) : (
              '-'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="卡号">{pkg?.cardNumber || '-'}</Descriptions.Item>
          <Descriptions.Item label="核销码类型">{pkg?.goodsCodeType ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="门店来源ID">{pkg?.storeSourceId ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="使用说明链接">
            {pkg?.useLink ? (
              <a href={pkg.useLink} target="_blank" rel="noreferrer">
                查看
              </a>
            ) : (
              '-'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="有效期至">{pkg?.validUntil ? dayjs(pkg.validUntil).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
          <Descriptions.Item label="抵扣积分">{pkg?.userPoints ?? 0}</Descriptions.Item>
          <Descriptions.Item label="门店ID">{pkg?.storeId || '-'}</Descriptions.Item>
          <Descriptions.Item label="商品ID">{pkg?.goodsId || '-'}</Descriptions.Item>
          <Descriptions.Item label="适用门店数量">{pkg?.storeCount ?? 0}</Descriptions.Item>
          <Descriptions.Item label="展示门店名称">{pkg?.primaryStoreName || '-'}</Descriptions.Item>
          <Descriptions.Item label="展示门店地址">{pkg?.primaryStoreAddress || '-'}</Descriptions.Item>
          <Descriptions.Item label="展示门店电话">{pkg?.primaryStorePhone || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{pkg ? new Date(pkg.createdAt).toLocaleString() : '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="编辑套餐">
        <Form form={editForm} layout="vertical" onFinish={onUpdate}>
          <Form.Item name="name" label="商品标题" rules={[{ required: true, message: '请输入商品标题' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="coverImageUrl" label="封面图地址">
            <Input placeholder="https://example.com/cover.jpg" />
          </Form.Item>
          <Form.Item name="priceYuan" label="现价(元)">
            <InputNumber min={0} style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="originalPriceYuan" label="原价(元)">
            <InputNumber min={0} style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="cardNumber" label="卡号">
            <Input placeholder="展示在订单详情中的卡号" />
          </Form.Item>
          <Form.Item name="goodsCodeType" label="核销码类型">
            <InputNumber min={1} max={3} style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="storeSourceId" label="门店来源ID">
            <InputNumber style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="useLink" label="使用说明链接">
            <Input placeholder="https://example.com/how-to-use" />
          </Form.Item>
          <Form.Item name="validUntil" label="有效期至">
            <DatePicker showTime style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="userPoints" label="抵扣积分">
            <InputNumber min={0} style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="storeId" label="门店ID">
            <Input placeholder="storeId" />
          </Form.Item>
          <Form.Item name="goodsId" label="商品ID">
            <Input placeholder="goodsId" />
          </Form.Item>
          <Form.Item name="storeCount" label="适用门店数量" tooltip="留空时将根据明细自动计算">
            <InputNumber min={0} style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="primaryStoreName" label="展示门店名称">
            <Input placeholder="例如：DT生活旗舰店（杭州滨江店）" />
          </Form.Item>
          <Form.Item name="primaryStoreAddress" label="展示门店地址">
            <Input placeholder="展示在订单详情顶部的地址" />
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
                    <Form.Item
                      label="名称"
                      name={[field.name, 'name']}
                      fieldKey={[field.fieldKey, 'name']}
                      rules={[{ required: true, message: '请输入套餐名称' }]}
                    >
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
                                fieldKey={[itemField.fieldKey, 'value']}
                                rules={[{ required: true, message: '请输入套餐明细' }]}
                                style={{ flex: 1, marginBottom: 0 }}
                              >
                                <Input placeholder="例如：鸡翅 / 汉堡 / 可乐" />
                              </Form.Item>
                              <Button danger type="link" icon={<MinusCircleOutlined />} onClick={() => itemHelpers.remove(itemField.name)}>
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
                    <Form.Item
                      label="名称"
                      name={[field.name, 'name']}
                      fieldKey={[field.fieldKey, 'name']}
                      rules={[{ required: true, message: '请输入名称' }]}
                    >
                      <Input placeholder="例如：牛排豪华套餐" />
                    </Form.Item>
                    <Form.Item
                      label="价格(元)"
                      name={[field.name, 'priceYuan']}
                      fieldKey={[field.fieldKey, 'priceYuan']}
                    >
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
                                fieldKey={[itemField.fieldKey, 'value']}
                                rules={[{ required: true, message: '请输入内容' }]}
                                style={{ flex: 1, marginBottom: 0 }}
                              >
                                <Input placeholder="例如：安格斯牛排（1份）" />
                              </Form.Item>
                              <Button danger type="link" icon={<MinusCircleOutlined />} onClick={() => itemHelpers.remove(itemField.name)}>
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
            <Button type="primary" htmlType="submit">
              保存
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="适用门店套餐预览">
        <Table
          rowKey={(record) => record.name}
          dataSource={pkg?.storeDetails ?? []}
          columns={storeDetailColumns}
          pagination={false}
          locale={{ emptyText: '暂无数据' }}
        />
      </Card>

      <Card title="套餐信息预览">
        <Table
          rowKey={(record) => record.name}
          dataSource={pkg?.packageItems ?? []}
          columns={packageItemColumns}
          pagination={false}
          locale={{ emptyText: '暂无数据' }}
        />
      </Card>

      <Card title="添加库存（核销码）">
        <Form form={stockForm} layout="vertical" onFinish={onAddStocks}>
          <Form.Item name="codes" label="核销码（支持空格/逗号/分号/换行分隔）" rules={[{ required: true }]}>
            <Input.TextArea rows={4} placeholder="例如：&#10;ABC-111&#10;XYZ-222&#10;..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                批量新增
              </Button>
              <Button onClick={() => stockForm.resetFields(['codes'])}>清空</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card title="库存列表（最新 200 条）">
        <List
          bordered
          dataSource={stocks}
          locale={{ emptyText: '暂无库存' }}
          renderItem={(it) => (
            <List.Item>
              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography.Text>{it.code}</Typography.Text>
                <Space>
                  <Tag color={it.used ? 'default' : 'green'}>{it.used ? '已核销' : '未核销'}</Tag>
                  <Typography.Text type="secondary">{new Date(it.createdAt).toLocaleString()}</Typography.Text>
                </Space>
              </Space>
            </List.Item>
          )}
        />
      </Card>
    </Flex>
  )
}
