"use client";
import React, { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import "./order-detail.css";

type SpInfo = {
  spimg: string;
  spname: string;
  orginPrice: string | number;
  nowPrice: string | number;
};

type PayStatus = '1' | '2' | '3' | '9'
type DestroyStatus = 1 | 2
type GoodsCodeType = '1' | '2' | '3'

type ApiStoreDetail = { name: string; items: string[] }
type ApiPackageItem = { name: string; priceCents: number; items: string[] }

type UserOpenResponse = {
  code: string
  orderNumber: string | null
  verificationCode: string | null
  unusedStock: number
  payStatus?: PayStatus
  destroyStatus?: DestroyStatus
  package: {
    id: string
    name: string
    description: string | null
    priceCents: number | null
    originalPriceCents: number | null
    coverImageUrl: string | null
    cardNumber: string | null
    goodsCodeType: number | null
    storeSourceId: number | null
    useLink: string | null
    validUntil: string | null
    userPoints: number | null
    storeId: string | null
    goodsId: string | null
    storeCount: number | null
    primaryStoreName: string | null
    primaryStoreAddress: string | null
    primaryStorePhone: string | null
    storeDetails: ApiStoreDetail[]
    packageItems: ApiPackageItem[]
  }
}

const formatPrice = (priceCents?: number | null) => {
  if (priceCents == null) return null
  return (priceCents / 100).toFixed(2)
}

const formatValidUntil = () => {
  const now = new Date()
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60 * 1000
  const shanghaiDate = new Date(utcMs + 8 * 60 * 60 * 1000)
  shanghaiDate.setDate(shanghaiDate.getDate() + 2)
  const pad = (num: number, length = 2) => String(num).padStart(length, "0")
  const year = shanghaiDate.getFullYear()
  const month = pad(shanghaiDate.getMonth() + 1)
  const day = pad(shanghaiDate.getDate())
  const hours = pad(shanghaiDate.getHours())
  const minutes = pad(shanghaiDate.getMinutes())
  const seconds = pad(shanghaiDate.getSeconds())
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

const normalizeGoodsCodeType = (value?: number | null): GoodsCodeType => {
  if (value === 1 || value === 3) return String(value) as GoodsCodeType
  return '2'
}

function OrderDetailPageInner() {
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get("code");
  const [orderDetail, setOrderDetail] = useState<UserOpenResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const infoSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!codeFromUrl) {
      setError("缺少 code 参数");
      setOrderDetail(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const controller = new AbortController();
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/user/open", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: codeFromUrl }),
          signal: controller.signal,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || "获取订单详情失败");
        }
        if (!cancelled) {
          setOrderDetail(data as UserOpenResponse);
        }
      } catch (err) {
        if (cancelled) return;
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "网络异常，请稍后再试");
        setOrderDetail(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchDetail();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [codeFromUrl]);



  if (!codeFromUrl) {
    return (
      <div className="order-detail-page" style={{ padding: 24 }}>
        <p>缺少 code 参数，无法加载订单信息。</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="order-detail-page" style={{ padding: 24 }}>
        <p>正在加载订单详情...</p>
      </div>
    );
  }

  if (!orderDetail || error) {
    return (
      <div className="order-detail-page" style={{ padding: 24 }}>
        <p>{error || "未能获取订单信息，请稍后重试。"}</p>
      </div>
    );
  }

  const pkg = orderDetail.package;
  const paybutton: PayStatus = orderDetail.payStatus ?? '2'
  const isDestruction: DestroyStatus = orderDetail.destroyStatus ?? 1
  const orderCs = "待支付 ";
  const rocallTime = "02:00";

  const spinfo: SpInfo = {
    spimg: pkg.coverImageUrl || "https://ebk-picture.oss-cn-hangzhou.aliyuncs.com/ebk-wap/img-20240522093911509-listimg.png",
    spname: pkg.name || "套餐名称",
    orginPrice: formatPrice(pkg.originalPriceCents) ?? "0.00",
    nowPrice: formatPrice(pkg.priceCents) ?? "0.00",
  };

  const goodsCodeType: GoodsCodeType = normalizeGoodsCodeType(pkg.goodsCodeType);
  const cardNum = pkg.cardNumber ?? "";
  const goodsCode =
    goodsCodeType === '3'
      ? pkg.useLink ?? ""
      : orderDetail.verificationCode ?? pkg.cardNumber ?? "";
  const store_source_id = pkg.storeSourceId ?? 1;
  const qrcodeSize = 210;
  const useLink = pkg.useLink ?? "";
  const orderNum = orderDetail.orderNumber ?? orderDetail.code;
  const time_valid = formatValidUntil();
  const user_points: number | null = typeof pkg.userPoints === 'number' && pkg.userPoints > 0 ? pkg.userPoints : null;
  const storeId = pkg.storeId ?? "";
  const goodsId = pkg.goodsId ?? "";
  const useStoreNum = pkg.storeCount ?? pkg.storeDetails?.length ?? 0;
  const store_name = pkg.primaryStoreName ?? "指定门店";
  const storeAddress = pkg.primaryStoreAddress ?? "门店地址待完善";
  const phone = pkg.primaryStorePhone ?? "";
  const package_items: { name: string; price: number }[] =
    pkg.packageItems?.length
      ? pkg.packageItems.map((item) => ({
          name: item.name,
          price: Number(((item.priceCents ?? 0) / 100).toFixed(2)),
        }))
      : [];
  const scrollToInfoSection = () => {
    if (infoSectionRef.current) {
      infoSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      const el = document.getElementById("section1");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="order-detail-page">
      <header className="mini-nav">
        <div className="mini-nav__back" aria-label="返回">
          <span className="mini-nav__back-icon" />
        </div>
        <div className="mini-nav__title">订单详情</div>
        <div className="mini-nav__actions" aria-hidden="true">
          <span className="mini-nav__actions-item mini-nav__actions-dots">
            <span />
            <span />
            <span />
          </span>
          <span className="mini-nav__actions-divider" />
          <span className="mini-nav__actions-item mini-nav__actions-line" />
          <span className="mini-nav__actions-divider" />
          <span className="mini-nav__actions-item mini-nav__actions-target">
            <span />
          </span>
        </div>
      </header>
      <div className="order-detail">
        {paybutton === '1' ? (
          <div className="order-detail__status">
            {orderCs}
            <span className="data-v-389a9f20">{rocallTime}</span>
          </div>
        ) : paybutton === '2' && isDestruction === 1 ? (
          <div className="order-detail__status">
            <span className="order-detail__status-text">订单已支付</span>
            <img
              className="order-detail__status-arrow"
              src="https://ebk-picture.oss-cn-hangzhou.aliyuncs.com/mini-wx/images/common/arr1.png"
              alt="arrow"
            />
          </div>
        ) : paybutton === '3' ? (
          <div className="order-detail__status">
            <span>订单已取消</span>
            <img
              className="data-v-389a9f20"
              src="https://ebk-picture.oss-cn-hangzhou.aliyuncs.com/mini-wx/images/common/arr1.png"
              alt="arrow"
            />
          </div>
        ) : paybutton === '2' && isDestruction === 2 ? (
          <div className="order-detail__status">
            <span>订单已核销</span>
            <img
              className="data-v-389a9f20"
              src="https://ebk-picture.oss-cn-hangzhou.aliyuncs.com/mini-wx/images/common/arr1.png"
              alt="arrow"
            />
          </div>
        ) : paybutton === '9' ? (
          <div className="order-detail__status">
            <span>订单已失效</span>
            <img
              className="data-v-389a9f20"
              src="https://ebk-picture.oss-cn-hangzhou.aliyuncs.com/mini-wx/images/common/arr1.png"
              alt="arrow"
            />
          </div>
        ) : null}

        {paybutton === '1' && (
          <div className="order-detail__pending-tip">
            <img
              className="data-v-389a9f20"
              src="https://ebk-picture.oss-cn-hangzhou.aliyuncs.com/mini-wx/images/bargain/listen.png"
              alt="listen"
            />
            <span className="data-v-389a9f20">
              快去支付吧，超过2分钟未支付，订单将自动取消。
            </span>
          </div>
        )}

        <div className="package-card">
          <a
            className="package-card__link"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              scrollToInfoSection();
            }}
          >
            <div
              className="package-card__image"
              style={{ backgroundImage: `url(${spinfo.spimg})` }}
            />
            <div className="package-card__body">
              <div className="package-card__name">{spinfo.spname}</div>
              <div className="package-card__details">
                <div className="package-card__price-original">
                  售价：{spinfo.orginPrice}
                </div>
              </div>
            </div>
            <div className="package-card__summary" />
          </a>
        </div>

        <div className="verification-card">
          {paybutton === '2' && isDestruction === 1 && (
            <div className="verification-card__section">
              <div className="section-list" style={{ paddingTop: 30 }}>
                {cardNum && (
                  <div className="verification-card__header u-clearfix">
                    <span className="verification-card__label u-float-left">卡号：</span>
                  </div>
                )}
                {cardNum && (
                  <div className="verification-card__row u-clearfix">
                    <span className="verification-card__code u-float-left">{cardNum}</span>
                    <span className="action-copy u-float-right">复制</span>
                  </div>
                )}

                <div
                  className="verification-card__hint"
                  style={{
                    height: "calc(60 * var(--rpx))",
                    display: "flex",
                    alignItems: "center",
                    background: "#FDEDED",
                    borderRadius: "calc(20 * var(--rpx))",
                    width: "90%",
                    margin: "0 auto",
                    paddingLeft: "calc(12 * var(--rpx))",
                  }}
                >
                  <img
                    className="data-v-389a9f20"
                    src="https://ebk-picture.oss-cn-hangzhou.aliyuncs.com/mini-wx/images/bargain/listen.png"
                    alt="sound"
                    style={{ width: "calc(40 * var(--rpx))", height: "calc(40 * var(--rpx))", marginRight: "calc(15 * var(--rpx))", marginLeft: "calc(10 * var(--rpx))" }}
                  />
                  <span
                    className="data-v-389a9f20"
                    style={{ color: "#D35A5E", fontSize: "calc(20 * var(--rpx))" }}
                  >
                    请提醒商家使用核销小程序验券核销
                  </span>
                </div>

                <div className="verification-card__header u-clearfix">
                  {goodsCodeType === '1' ? (
                    <span className="verification-card__label u-float-left">卡密：</span>
                  ) : goodsCodeType === '2' ? (
                    <span className="verification-card__label u-float-left">核销码：</span>
                  ) : (
                    <span className="verification-card__label u-float-left">领取链接：</span>
                  )}
                </div>

                <div className="verification-card__media" style={{ display: "flex", justifyContent: "center" }}>
                  <div className="verification-card__canvas">
                    <img
                      className="data-v-389a9f20"
                      alt="qrcode"
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=${qrcodeSize}x${qrcodeSize}&data=${encodeURIComponent(goodsCode)}`}
                      style={{ width: qrcodeSize, height: qrcodeSize, borderRadius: 8 }}
                    />
                  </div>
                </div>

                {store_source_id !== 5 ? (
                  <div className="verification-card__row u-clearfix is-last" style={{ marginTop: 40 }}>
                    {goodsCodeType === '3' ? (
                      <a className="verification-card__code u-float-left text-link" href={goodsCode}>
                        {goodsCode}
                      </a>
                    ) : (
                      <span className="verification-card__code u-float-left">{goodsCode}</span>
                    )}
                    <span className="action-copy u-float-right">复制</span>
                  </div>
                ) : (
                  <div className="verification-card__row u-clearfix is-last" style={{ marginTop: 40 }}>
                    <span className="verification-card__code-exchange u-float-left">{goodsCode}</span>
                    <span className="action-copy-exchange">请点击去核销</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {paybutton === '2' && isDestruction === 1 ? (
          <div className="usage-tips">
            <img
              className="data-v-389a9f20"
              src="https://ebk-picture.oss-cn-hangzhou.aliyuncs.com/mini-wx/images/bargain/listen.png"
              alt="listen"
              style={{ width: 32, height: 32, verticalAlign: "middle" }}
            />
            <div className="usage-tips__content">
              <span className="u-float-left">使用方法详见</span>
              <a className="text-link u-float-left" href="#">商品详情</a>
            </div>
          </div>
        ) : (
          <div className="data-v-389a9f20" />
        )}

        <div className="info-card">
          <div className="section-title">订单信息</div>
          <div className="section-list">
            <div className="info-row">
              <span className="info-row__label">订单号码：</span>
              <span className="info-row__value">{orderNum}</span>
              <span className="action-copy">复制</span>
            </div>
            {time_valid ? (
              <div className="info-row">
                <span className="info-row__label">有效期至：</span>
                <span className="info-row__value">{time_valid}</span>
              </div>
            ) : (
              <span className="data-v-389a9f20" />
            )}
            <div className="info-row info-row--payment">
              <span className="info-row__label">原       价：</span>
              <span className="info-row__value">¥{spinfo.orginPrice}</span>
            </div>
            {user_points == null ? (
              <div className="info-row info-row--payment" />
            ) : (
              <div className="info-row">
                <span className="info-row__label">抵扣积分：</span>
                <span className="info-row__value">{user_points}</span>
              </div>
            )}
          </div>
        </div>

        {paybutton === '2' && isDestruction === 1 && (
          <div className="store-card store-card--list">
            <div className="store-card__row store-card__row--store">
              <div className="store-card__label">适用门店</div>
              <div className="data-v-389a9f20 store-card__link">
                {useStoreNum}家店适用
                <img
                  src="https://ebk-picture.oss-cn-hangzhou.aliyuncs.com/mini-wx/images/common/arr1.png"
                  alt="arr"
                />
              </div>
            </div>
            <div className="data-v-389a9f20" style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
              <div className="store-card__content">
                <div className="store-card__link">
                  <span className="store-card__name">{store_name}</span>
                  <span className="store-card__address">{storeAddress}</span>
                </div>
              </div>
              <div className="store-card__call">
                <a className="store-card__call-button" href={`tel:${phone}`}>商家电话</a>
                <img
                  className="store-card__call-icon"
                  src="https://ebk-picture.oss-cn-hangzhou.aliyuncs.com/ebk-wap/img-202309060318386529-Group%2034149%403x.png"
                  alt="phone"
                />
              </div>
            </div>
          </div>
        )}

        {package_items && (
          <div className="info-card" id="section1" ref={infoSectionRef}>
            <div className="section-title">套餐信息</div>
            <div className="package-list">
              {package_items.map((it, idx) => (
                <div className="package-list__item" key={idx}>
                  <div className="package-list__name">{it.name}</div>
                  <div className="price-amount">¥{it.price}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {!false && paybutton === '1' && (
        <div className="order-footer">
          <div className="order-footer__content">
            <div className="price-amount">
              <span className="order-footer__price-now">
                ¥<span className="data-v-389a9f20">{spinfo.nowPrice}</span>
              </span>
              <span className="order-footer__price-original">¥{spinfo.orginPrice}</span>
            </div>
            <div className="order-footer__actions u-clearfix">
              <div className="order-footer__cancel">取消订单</div>
              <div className="order-footer__pay">立即支付</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={<div className="order-detail-page" style={{ padding: 24 }}>页面加载中...</div>}>
      <OrderDetailPageInner />
    </Suspense>
  )
}
