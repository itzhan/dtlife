"use client"
import { useCallback, useEffect, useState } from 'react'
import {
  Button,
  Card,
  Collapse,
  DatePicker,
  Descriptions,
  Drawer,
  Flex,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import type { TableProps } from 'antd'
import type { FormListFieldData } from 'antd/es/form'
import { useParams } from 'next/navigation'
import dayjs from 'dayjs'

type StoreDetail = { name: string; items: string[] }
type PackageItem = { name: string; priceCents: number | null; items?: string[] }
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
type Stock = {
  id: string
  code: string
  used: boolean
  createdAt: string
  usedAt?: string | null
  validUntil?: string | null
  shareCode?: string | null
  shareLink?: string | null
}

type PackageItemFormRow = { name?: string; priceYuan?: number | null }
type UpdateFormValues = {
  name: string
  priceYuan?: number
  coverImageUrl?: string
  storeCount?: number
  primaryStoreName?: string
  primaryStoreAddress?: string
  primaryStorePhone?: string
}
type PackageItemFormValues = { packageItems?: PackageItemFormRow[] }
type NewStockFormValues = { newStocks?: { code?: string; validDate?: dayjs.Dayjs | null }[] }

const RAW_SHARE_LINK_ORIGIN = (process.env.NEXT_PUBLIC_SHARE_LINK_ORIGIN || '').trim()

const sanitizeOrigin = (origin: string, runtimeProtocol?: string) => {
  const trimmed = origin.replace(/\/$/, '')
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  const protocol = runtimeProtocol || 'https:'
  const normalizedProtocol = protocol.endsWith(':') ? protocol : `${protocol}:`
  return `${normalizedProtocol}//${trimmed}`
}

export default function PackageDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const [messageApi, contextHolder] = message.useMessage()
  const [pkg, setPkg] = useState<Pkg | null>(null)
  const [stocks, setStocks] = useState<Stock[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingStockId, setDeletingStockId] = useState<string | null>(null)
  const [editVisible, setEditVisible] = useState(false)
  const [generatingLinkId, setGeneratingLinkId] = useState<string | null>(null)
  const [creatingStockKey, setCreatingStockKey] = useState<string | null>(null)
  const [editingStockId, setEditingStockId] = useState<string | null>(null)
  const [editingStockValue, setEditingStockValue] = useState<{ code: string; validDate: dayjs.Dayjs | null }>({
    code: '',
    validDate: null,
  })
  const [windowOrigin, setWindowOrigin] = useState(() => (RAW_SHARE_LINK_ORIGIN ? sanitizeOrigin(RAW_SHARE_LINK_ORIGIN) : ''))
  const [editForm] = Form.useForm<UpdateFormValues>()
  const [packageForm] = Form.useForm<PackageItemFormValues>()
  const [stockForm] = Form.useForm<NewStockFormValues>()

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
            priceYuan: pkgData.priceCents / 100,
            coverImageUrl: pkgData.coverImageUrl ?? '',
            storeCount: pkgData.storeCount,
            primaryStoreName: pkgData.primaryStoreName ?? '',
            primaryStoreAddress: pkgData.primaryStoreAddress ?? '',
            primaryStorePhone: pkgData.primaryStorePhone ?? '',
          })
          packageForm.setFieldsValue({
            packageItems: (pkgData.packageItems ?? []).map((item) => ({
              name: item.name,
              priceYuan: item.priceCents != null ? item.priceCents / 100 : undefined,
            })),
          })
        }
        if (stocksRes.ok) {
          const stockData = (await stocksRes.json()) as Stock[]
          stockData.sort((a, b) => new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf())
          setStocks(stockData)
        }
      } catch (error) {
        console.error(error)
        messageApi.error('加载套餐详情失败')
      } finally {
        setLoading(false)
      }
    },
    [editForm, id, messageApi, packageForm]
  )

  useEffect(() => {
    void load(false)
  }, [load])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (RAW_SHARE_LINK_ORIGIN) {
      setWindowOrigin(sanitizeOrigin(RAW_SHARE_LINK_ORIGIN, window.location.protocol))
      return
    }
    setWindowOrigin(window.location.origin.replace(/\/$/, ''))
  }, [])

  const sendUpdate = async (payload: Record<string, unknown>) => {
    const res = await fetch(`/api/packages/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({} as { message?: string }))
      messageApi.error(d.message || '更新失败')
      return false
    }
    messageApi.success('已保存')
    void load()
    return true
  }

  const onUpdate = async (values: UpdateFormValues) => {
    const payload: Record<string, unknown> = {}
    payload.name = values.name
    payload.description = pkg?.description ?? ''
    const normalizedPrice = Number(values.priceYuan ?? 0)
    payload.priceYuan = normalizedPrice
    payload.originalPriceYuan = normalizedPrice
    payload.coverImageUrl = (values.coverImageUrl ?? '').trim() || null
    payload.cardNumber = pkg?.cardNumber ?? null
    payload.goodsCodeType = 2
    payload.storeSourceId = pkg?.storeSourceId ?? null
    payload.useLink = pkg?.useLink ?? null
    payload.userPoints = pkg?.userPoints ?? 0
    payload.storeId = pkg?.storeId ?? null
    payload.goodsId = pkg?.goodsId ?? null
    payload.storeCount = values.storeCount
    payload.primaryStoreName = values.primaryStoreName ?? null
    payload.primaryStoreAddress = values.primaryStoreAddress ?? null
    payload.primaryStorePhone = values.primaryStorePhone ?? null
    const ok = await sendUpdate(payload)
    if (ok) setEditVisible(false)
  }

  const handleUpdatePackageItems = async (values: PackageItemFormValues) => {
    const payload = {
      packageItems: (values.packageItems || [])
        .map((item) => ({
          name: item.name,
          priceYuan: item.priceYuan ?? undefined,
        }))
        .filter((item) => item.name),
    }
    await sendUpdate(payload)
  }

  const onDeleteStock = async (stockId: string) => {
    if (!id) return
    setDeletingStockId(stockId)
    try {
      const res = await fetch(`/api/packages/${id}/stocks?stockId=${stockId}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({} as { message?: string }))
      if (!res.ok) return messageApi.error(data.message || '删除失败')
      messageApi.success('删除成功')
      setStocks((prev) => prev.filter((stock) => stock.id !== stockId))
    } catch (error) {
      console.error(error)
      messageApi.error('删除失败')
    } finally {
      setDeletingStockId(null)
    }
  }

  const startEditStock = (stock: Stock) => {
    setEditingStockId(stock.id)
    setEditingStockValue({
      code: stock.code,
      validDate: stock.validUntil ? dayjs(stock.validUntil) : null,
    })
  }

  const cancelEditStock = () => {
    setEditingStockId(null)
    setEditingStockValue({ code: '', validDate: null })
  }

  const onSaveStock = async () => {
    if (!editingStockId) return
    const trimmed = editingStockValue.code.trim()
    if (!trimmed) return messageApi.warning('请输入核销码')
    try {
      const payload = {
        code: trimmed,
        validDate: editingStockValue.validDate ? editingStockValue.validDate.format('YYYY-MM-DD') : null,
      }
      const res = await fetch(`/api/stocks/${editingStockId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({} as { message?: string }))
      if (!res.ok) return messageApi.error(data.message || '保存失败')
      messageApi.success('已更新')
      cancelEditStock()
      void load()
    } catch (error) {
      console.error(error)
      messageApi.error('保存失败')
    }
  }

  const buildShareLink = (stock: Stock) => {
    if (stock.shareLink) return stock.shareLink
    if (!stock.shareCode) return null
    const relative = `/bargain/order-detail?code=${encodeURIComponent(stock.shareCode)}`
    if (!windowOrigin) return relative
    return `${windowOrigin}${relative}`
  }

  const copyShareLink = async (stock: Stock) => {
    const link = buildShareLink(stock)
    if (!link) return messageApi.warning('请先生成链接')
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(link)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = link
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      messageApi.success('链接已复制')
    } catch (error) {
      console.error(error)
      messageApi.error('复制失败，请手动复制')
    }
  }

  const onGenerateShareLink = async (stockId: string) => {
    setGeneratingLinkId(stockId)
    try {
      const res = await fetch(`/api/stocks/${stockId}/link`, { method: 'POST' })
      const data = await res.json().catch(() => ({} as { message?: string; code?: string; link?: string }))
      if (!res.ok) return messageApi.error(data.message || '生成链接失败')
      setStocks((prev) =>
        prev.map((stock) =>
          stock.id === stockId
            ? {
                ...stock,
                shareCode: data.code ?? stock.shareCode,
                shareLink: data.link ?? stock.shareLink,
              }
            : stock
        )
      )
      messageApi.success('链接已生成')
    } catch (error) {
      console.error(error)
      messageApi.error('生成链接失败')
    } finally {
      setGeneratingLinkId(null)
    }
  }

  const renderPackageItemsEditor = (
    <Form form={packageForm} layout="vertical" onFinish={handleUpdatePackageItems}>
      <Form.List name="packageItems">
        {(fields, { add, remove }) => {
          const data = fields.map((field, index) => ({ ...field, index }))
          const columns: TableProps<FormListFieldData & { index: number }>['columns'] = [
            {
              title: '套餐名',
              dataIndex: 'name',
              render: (_value, record) => {
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
              render: (_value, record) => {
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
              dataIndex: 'actions',
              width: 80,
              render: (_value, record) => (
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
              <Flex justify="space-between" style={{ marginTop: 12 }}>
                <Button type="dashed" onClick={() => add()}>
                  新增套餐项
                </Button>
                <Button type="primary" onClick={() => packageForm.submit()}>
                  保存
                </Button>
              </Flex>
            </>
          )
        }}
      </Form.List>
    </Form>
  )

  return (
    <>
      {contextHolder}
      <Flex vertical gap={16} style={{ padding: 16 }}>
      <Typography.Title level={3} style={{ margin: 0 }}>
        套餐详情
      </Typography.Title>
      <Card
        loading={loading}
        extra={
          <Space>
            <Typography.Text type="secondary">未使用库存：{pkg?.unusedStock ?? '-'}</Typography.Text>
            <Button type="link" onClick={() => setEditVisible(true)}>
              编辑
            </Button>
          </Space>
        }
      >
        <Descriptions column={1} title={pkg?.name}>
          <Descriptions.Item label="套餐ID">{pkg?.id}</Descriptions.Item>
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
          <Descriptions.Item label="适用门店数量">{pkg?.storeCount ?? 0}</Descriptions.Item>
          <Descriptions.Item label="展示门店名称">{pkg?.primaryStoreName || '-'}</Descriptions.Item>
          <Descriptions.Item label="展示门店地址">{pkg?.primaryStoreAddress || '-'}</Descriptions.Item>
          <Descriptions.Item label="展示门店电话">{pkg?.primaryStorePhone || '-'}</Descriptions.Item>
        </Descriptions>
        <Collapse
          style={{ marginTop: 16 }}
          items={[
            {
              key: 'more',
              label: '更多信息',
              children: (
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="描述">{pkg?.description || '-'}</Descriptions.Item>
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
                  <Descriptions.Item label="抵扣积分">{pkg?.userPoints ?? 0}</Descriptions.Item>
                  <Descriptions.Item label="门店ID">{pkg?.storeId || '-'}</Descriptions.Item>
                  <Descriptions.Item label="商品ID">{pkg?.goodsId || '-'}</Descriptions.Item>
                  <Descriptions.Item label="有效期至">{pkg?.validUntil ? dayjs(pkg.validUntil).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
                  <Descriptions.Item label="创建时间">{pkg ? new Date(pkg.createdAt).toLocaleString() : '-'}</Descriptions.Item>
                </Descriptions>
              ),
            },
          ]}
        />
      </Card>

      <Drawer
        title="编辑套餐"
        width={720}
        open={editVisible}
        forceRender
        destroyOnClose={false}
        onClose={() => setEditVisible(false)}
      >
        <Form form={editForm} layout="vertical" onFinish={onUpdate}>
          <Form.Item name="name" label="商品标题" rules={[{ required: true, message: '请输入商品标题' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="coverImageUrl" label="封面图地址">
            <Input placeholder="https://example.com/cover.jpg" />
          </Form.Item>
          <Form.Item name="priceYuan" label="价格(元)" rules={[{ required: true, message: '请输入价格' }]}>
            <InputNumber min={0} style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="storeCount" label="适用门店数量" tooltip="留空时将根据门店列表自动计算">
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

          <Form.Item style={{ marginTop: 24 }}>
            <Button type="primary" htmlType="submit">
              保存
            </Button>
          </Form.Item>
        </Form>
      </Drawer>

      <Card title="套餐信息列表">{renderPackageItemsEditor}</Card>

      <Card title="库存列表（最新 200 条）">
        <Form form={stockForm} component={false}>
          <Form.List name="newStocks">
            {(fields, helpers) => {
              const addRow = () => helpers.add({})
              const removeRow = (field: FormListFieldData) => helpers.remove(field.name)
              const saveRow = async (field: FormListFieldData) => {
                const fieldName = field.name as number
                try {
                  await stockForm.validateFields([['newStocks', fieldName, 'code']])
                } catch {
                  return
                }
                const list = stockForm.getFieldValue('newStocks') || []
                const current = list[fieldName]
                const code = (current?.code || '').trim()
                if (!code) return messageApi.warning('请输入核销码')
                setCreatingStockKey(String(field.key))
                try {
                  const payload = {
                    entries: [
                      {
                        code,
                        validDate: current?.validDate ? (current.validDate as dayjs.Dayjs).format('YYYY-MM-DD') : undefined,
                      },
                    ],
                  }
                  const res = await fetch(`/api/packages/${id}/stocks`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                  })
                  const data = await res.json().catch(() => ({} as { message?: string }))
                  if (!res.ok) return messageApi.error(data.message || '添加失败')
                  helpers.remove(field.name)
                  messageApi.success('新增成功')
                  stockForm.setFieldsValue({ newStocks: stockForm.getFieldValue('newStocks') || [] })
                  void load()
                } catch (error) {
                  console.error(error)
                  messageApi.error('添加失败')
                } finally {
                  setCreatingStockKey(null)
                }
              }

              type StockTableRecord =
                | { key: string; kind: 'new'; field: FormListFieldData }
                | { key: string; kind: 'existing'; stock: Stock; order: number }

              const dataSource: StockTableRecord[] = [
                ...fields.map((field) => ({ key: `new-${field.key}`, kind: 'new' as const, field })),
                ...stocks.map((stock, idx) => ({ key: stock.id, kind: 'existing' as const, stock, order: idx + 1 })),
              ]

              const columns: TableProps<StockTableRecord>['columns'] = [
                {
                  title: '序号',
                  dataIndex: 'index',
                  width: 70,
                  render: (_value, record) => (record.kind === 'existing' ? record.order : '-'),
                },
              {
                title: '核销码',
                dataIndex: 'code',
                render: (_value, record) => {
                  if (record.kind === 'new') {
                      return (
                        <Form.Item
                          name={['newStocks', record.field.name, 'code']}
                          rules={[{ required: true, message: '请输入核销码' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Input placeholder="例如：ABC-123" />
                        </Form.Item>
                      )
                  }
                  if (record.kind === 'existing' && editingStockId === record.stock.id) {
                    return (
                      <Input
                        value={editingStockValue.code}
                        onChange={(e) => setEditingStockValue((prev) => ({ ...prev, code: e.target.value }))}
                      />
                    )
                  }
                  return <Typography.Text code>{record.stock.code}</Typography.Text>
                },
              },
              {
                title: '核销有效期',
                dataIndex: 'validUntil',
                render: (_value, record) => {
                  if (record.kind === 'new') {
                    return (
                      <Form.Item name={['newStocks', record.field.name, 'validDate']} style={{ marginBottom: 0 }}>
                        <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
                      </Form.Item>
                    )
                  }
                  if (record.kind === 'existing' && editingStockId === record.stock.id) {
                    return (
                      <DatePicker
                        style={{ width: '100%' }}
                        placeholder="选择日期"
                        value={editingStockValue.validDate}
                        onChange={(value) => setEditingStockValue((prev) => ({ ...prev, validDate: value }))}
                      />
                    )
                  }
                  return record.stock.validUntil ? (
                    dayjs(record.stock.validUntil).format('YYYY-MM-DD')
                  ) : (
                    <Typography.Text type="secondary">未设置</Typography.Text>
                  )
                },
              },
                {
                  title: '状态',
                  dataIndex: 'used',
                  render: (_value, record) =>
                    record.kind === 'existing' ? (
                      <Tag color={record.stock.used ? 'default' : 'green'}>{record.stock.used ? '已核销' : '未核销'}</Tag>
                    ) : (
                      '-'
                    ),
                },
                {
                  title: '自动跳转链接',
                  dataIndex: 'shareCode',
                  render: (_value, record) => {
                    if (record.kind === 'new') return '-'
                    const link = buildShareLink(record.stock)
                    if (!link) return <Typography.Text type="secondary">-</Typography.Text>
                    const compact = link.replace(/^https?:\/\//, '').slice(0, 16)
                    return (
                      <Space>
                        <Typography.Text style={{ maxWidth: 140 }} ellipsis={{ tooltip: link }}>
                          {compact}…
                        </Typography.Text>
                        <Button size="small" onClick={() => void copyShareLink(record.stock)}>
                          复制
                        </Button>
                      </Space>
                    )
                  },
                },
                {
                  title: '操作',
                  dataIndex: 'actions',
                  render: (_value, record) => {
                    if (record.kind === 'new') {
                      return (
                        <Space>
                          <Button
                            size="small"
                            type="primary"
                            onClick={() => void saveRow(record.field)}
                            loading={creatingStockKey === String(record.field.key)}
                          >
                            保存
                          </Button>
                          <Button size="small" onClick={() => removeRow(record.field)}>
                            取消
                          </Button>
                        </Space>
                      )
                    }
                    const isEditing = editingStockId === record.stock.id
                    return (
                      <Space>
                        {isEditing ? (
                          <>
                            <Button size="small" type="primary" onClick={() => void onSaveStock()}>
                              保存
                            </Button>
                            <Button size="small" onClick={cancelEditStock}>
                              取消
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="small" onClick={() => startEditStock(record.stock)}>
                              编辑
                            </Button>
                            <Button
                              size="small"
                              onClick={() => void onGenerateShareLink(record.stock.id)}
                              loading={generatingLinkId === record.stock.id}
                            >
                              {record.stock.shareCode ? '重新生成链接' : '生成链接'}
                            </Button>
                            <Popconfirm title="确认删除该核销码？" okText="删除" cancelText="取消" onConfirm={() => onDeleteStock(record.stock.id)}>
                              <Button type="link" danger loading={deletingStockId === record.stock.id}>
                                删除
                              </Button>
                            </Popconfirm>
                          </>
                        )}
                      </Space>
                    )
                  },
                },
              ]

              return (
                <>
                  <Flex justify="flex-end" style={{ marginBottom: 12 }}>
                    <Button type="dashed" onClick={addRow}>
                      新增核销码
                    </Button>
                  </Flex>
                  <Table
                    rowKey="key"
                    dataSource={dataSource}
                    columns={columns}
                    pagination={false}
                    locale={{ emptyText: '暂无库存' }}
                  />
                </>
              )
            }}
          </Form.List>
        </Form>
      </Card>
      </Flex>
    </>
  )
}
