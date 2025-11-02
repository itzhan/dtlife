"use client";
import React, { useMemo } from "react";

type SpInfo = {
  spimg: string;
  spname: string;
  orginPrice: string | number;
  nowPrice: string | number;
};

type StoreDetail = {
  store_goods_name: string;
  store_goods_content: string[][];
};

export default function OrderDetailPage() {
  const paybutton = 2; // 1: 待支付, 2: 已支付, 3: 已取消, 9: 已失效
  const isDestruction = 1; // 1: 未核销, 2: 已核销
  const orderCs = "待支付 ";
  const rocallTime = "02:00"; // 示例倒计时
  const spinfo: SpInfo = {
    spimg:
      "https://ebk-picture.oss-cn-hangzhou.aliyuncs.com/ebk-wap/img-20240522093911509-listimg.png",
    spname: "示例商品名称，支持超长超长超长展示",
    orginPrice: "99.00",
    nowPrice: "49.90",
  };
  const cardNum = "8888 6666 2222 0000"; // 示例卡号
  const goodsCodeType = 2; // 1: 卡密 2: 核销码 3: 领取链接
  const goodsCode = "6F8A-2K9P-7QW3"; // 展示的核销码/卡密/链接
  const store_source_id = 1; // 5 时显示“请点击去核销”
  const qrcodeSize = 210; // 仅用于占位
  const useLink = "https://dt-life.example.com/goods/90001"; // 使用方法详见的链接（可为空）
  const orderNum = "DT20251102000129";
  const time_valid = "2025-12-31 23:59:59";
  const user_points: string | number | null = 100;
  const storeId = "10001";
  const goodsId = "90001";
  const useStoreNum = 12;
  const store_name = "DT生活旗舰店（杭州滨江店）";
  const storeAddress = "浙江省杭州市滨江区长河街道xxx路88号A座1层";
  const phone = "0571-88886666";
  const store_detail_data: StoreDetail[] = [
    {
      store_goods_name: "A套餐",
      store_goods_content: [["鸡翅", "汉堡", "可乐"], ["薯条"]],
    },
    {
      store_goods_name: "B套餐",
      store_goods_content: [["牛排", "沙拉"], ["果汁"]],
    },
  ];

  const rawWxss = `@charset "UTF-8";

.rules.data-v-389a9f20 {
    background: #fff;
    border-radius: 24rpx;
    box-shadow: 0 0 4px 0 rgba(0,0,0,.04);
    margin-bottom: 20rpx;
    margin-top: 20rpx;
    padding: 20rpx 24rpx
}

.rules .titleContent.data-v-389a9f20 {
    -webkit-flex: 1;
    flex: 1;
    overflow: hidden
}

.rules .titleContent .storeName.data-v-389a9f20 {
    color: #333;
    font-size: 28rpx;
    font-weight: 700;
    height: 40rpx;
    line-height: 60rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 100%
}

.rules .titleContent .storeAddress.data-v-389a9f20 {
    color: #999;
    font-size: 24rpx;
    line-height: 32rpx;
    padding-top: 12rpx
}

.rules .ruleList.data-v-389a9f20 {
    border-bottom: 1rpx solid #eff2f4;
    display: -webkit-flex;
    display: flex;
    height: 72rpx;
    -webkit-justify-content: space-between;
    justify-content: space-between
}

.rules .ruleList .titlename.data-v-389a9f20 {
    color: #999;
    font-size: 28rpx;
    height: 40rpx;
    line-height: 46rpx;
    margin-right: 16rpx;
    white-space: nowrap
}

.rules .ruleList .titleCon.data-v-389a9f20 {
    color: #333;
    -webkit-flex: 1;
    flex: 1;
    font-size: 28rpx;
    height: 40rpx;
    line-height: 40rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap
}

.rules .ruleList .useStore.data-v-389a9f20 {
    color: #666;
    display: inline-block;
    font-size: 24rpx;
    margin-left: 34rpx
}

.rules .ruleList .useStore wx-image.data-v-389a9f20 {
    height: 20rpx;
    margin-left: 12rpx;
    width: 12rpx
}

.useType .copy.data-v-389a9f20 {
    color: #ff4b33;
    float: right;
    font-size: 24rpx
}

.detail_info.data-v-389a9f20 {
    color: #202020;
    font-family: 思源黑体;
    margin-right: 30rpx
}

.one_detail.data-v-389a9f20 {
    font-size: 35rpx;
    font-weight: 700;
    text-indent: 30rpx
}

.two_detail.data-v-389a9f20 {
    font-size: 30rpx;
    font-weight: 700;
    line-height: 70rpx;
    margin-left: 30rpx
}

.three_detail.data-v-389a9f20 {
    -webkit-align-items: center;
    align-items: center;
    color: #111;
    display: -webkit-flex;
    display: flex;
    font-size: 28rpx;
    font-weight: 400;
    -webkit-justify-content: space-between;
    justify-content: space-between;
    line-height: 52rpx;
    margin-left: 28rpx
}

.useType_url.data-v-389a9f20 {
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    display: -webkit-box;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 225rpx;
    word-break: break-all
}

.orderdtail.data-v-389a9f20 {
    width: 100%
}

.orderWrapper.data-v-389a9f20 {
    padding: 30rpx 30rpx 140rpx
}

.orderWrapper .orderStatus.data-v-389a9f20 {
    color: #333;
    font-size: 48rpx;
    font-weight: 600;
    height: 66rpx;
    line-height: 66rpx
}

.orderWrapper .orderStatus wx-image.data-v-389a9f20 {
    height: 20rpx;
    margin-left: 40rpx;
    vertical-align: middle;
    width: 10rpx
}

.orderWrapper .orderStatus wx-text.data-v-389a9f20 {
    color: #f6831a;
    font-size: 48rpx
}

.orderWrapper .orderStatus.active.data-v-389a9f20 {
    display: none
}

.orderWrapper .nopayTips.data-v-389a9f20 {
    background: #fff;
    border-radius: 10rpx;
    margin-top: 20rpx;
    padding: 28rpx 20rpx
}

.orderWrapper .nopayTips wx-image.data-v-389a9f20 {
    height: 62rpx;
    vertical-align: middle;
    width: 60rpx
}

.orderWrapper .nopayTips wx-text.data-v-389a9f20 {
    color: #666;
    font-size: 24rpx;
    margin-left: 20rpx
}

.orderWrapper .spinfo.data-v-389a9f20 {
    background-color: #fff;
    border-radius: 12rpx;
    box-shadow: 0rpx 4rpx 0rpx rgba(0,0,0,.07);
    margin-top: 20rpx;
    padding: 0 20rpx
}

.orderWrapper .spinfo .linkHref.data-v-389a9f20 {
    display: -webkit-flex;
    display: flex;
    padding: 40rpx 0
}

.orderWrapper .spinfo .linkHref .spimg.data-v-389a9f20 {
    background-position: 50%;
    background-repeat: no-repeat;
    background-size: cover;
    border-radius: 4rpx;
    height: 112rpx;
    margin-right: 20rpx;
    width: 112rpx
}

.orderWrapper .spinfo .linkHref .spData.data-v-389a9f20 {
    -webkit-flex: 1;
    flex: 1;
    overflow: hidden
}

.orderWrapper .spinfo .linkHref .spData .spName.data-v-389a9f20 {
    color: #333;
    -webkit-flex: 1;
    flex: 1;
    font-size: 28rpx;
    font-weight: 600;
    height: 36rpx;
    line-height: 28rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap
}

.orderWrapper .spinfo .linkHref .spData .spDetails.data-v-389a9f20 {
    padding-top: 10rpx
}

.orderWrapper .spinfo .linkHref .spData .spDetails .oldPrice.data-v-389a9f20 {
    color: #666;
    font-size: 24rpx;
    line-height: 34rpx
}

.orderWrapper .spinfo .linkHref .spData .spDetails .spPrice.data-v-389a9f20 {
    color: #666;
    font-size: 24rpx;
    line-height: 34rpx;
    padding-top: 10rpx
}

.orderWrapper .spinfo .linkHref .allprice.data-v-389a9f20 {
    padding-top: 12rpx
}

.orderWrapper .spinfo .linkHref .allprice .price.data-v-389a9f20 {
    color: #ff4b33;
    font-size: 56rpx;
    font-weight: 600;
    height: 66rpx;
    line-height: 66rpx
}

.orderWrapper .spinfo .linkHref .allprice .price wx-text.data-v-389a9f20 {
    color: #ff4b33;
    font-size: 28rpx;
    line-height: 36rpx
}

.orderWrapper .spinfo .linkHref .allprice .barginNum.data-v-389a9f20 {
    color: #ff4b33;
    font-size: 26rpx;
    font-weight: 600;
    line-height: 36rpx;
    padding-top: 6rpx
}

.orderWrapper .hexiaoList.data-v-389a9f20 {
    background: #fff;
    border-radius: 12rpx;
    box-shadow: 0rpx 0rpx 8rpx 0rpx rgba(0,0,0,.07);
    margin-top: 14rpx;
    padding: 0 20rpx
}

.orderWrapper .hexiaoList .codetype .listCon.data-v-389a9f20,.orderWrapper .hexiaoList .codetype.data-v-389a9f20 {
    width: 100%
}

.orderWrapper .hexiaoList .codetype .listCon .ercodetitle.data-v-389a9f20 {
    padding-top: 30rpx;
    width: 100%
}

.orderWrapper .hexiaoList .codetype .listCon .ercodetitle .hexiao.data-v-389a9f20 {
    color: #333;
    display: inline-block;
    font-size: 32rpx;
    font-weight: 600;
    height: 40rpx;
    line-height: 40rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 80%
}

.orderWrapper .hexiaoList .codetype .listCon .ercodetitle .opencode.data-v-389a9f20 {
    color: #ff4b33;
    display: inline-block;
    font-size: 24rpx;
    text-align: right;
    width: 20%
}

.orderWrapper .hexiaoList .codetype .listCon .ercode.data-v-389a9f20 {
    border-bottom: 2rpx dashed #e8e8e8;
    padding-bottom: 40rpx;
    width: 100%
}

.orderWrapper .hexiaoList .codetype .listCon .ercode .ercodeNum.data-v-389a9f20 {
    color: #666;
    font-size: 32rpx;
    height: 40rpx;
    line-height: 40rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 80%
}

.orderWrapper .hexiaoList .codetype .listCon .ercode .ercodeNum.link.data-v-389a9f20 {
    color: #007aff
}

.orderWrapper .hexiaoList .codetype .listCon .ercode .copy.data-v-389a9f20 {
    color: #ff4b33;
    display: inline-block;
    font-size: 24rpx;
    height: 40rpx;
    line-height: 40rpx;
    text-align: right;
    width: 20%
}

.orderWrapper .hexiaoList .codetype .listCon .ercode.last.data-v-389a9f20 {
    border-bottom: none
}

.orderWrapper .hexiaoList.active.data-v-389a9f20 {
    display: none
}

.orderWrapper .useTips.data-v-389a9f20 {
    background: #fff;
    border-radius: 10rpx;
    margin-top: 16rpx;
    padding: 28rpx 20rpx
}

.orderWrapper .useTips wx-image.data-v-389a9f20 {
    height: 62rpx;
    vertical-align: middle;
    width: 60rpx
}

.orderWrapper .useTips .useType.data-v-389a9f20 {
    color: #666;
    display: inline-block;
    font-size: 24rpx;
    margin-left: 20rpx
}

.orderWrapper .useTips .link.data-v-389a9f20,.orderWrapper .useTips .useType .linkHref.data-v-389a9f20 {
    color: #f6831a;
    font-size: 24rpx;
    margin-left: 6rpx
}

.orderWrapper .orderInfo.data-v-389a9f20 {
    background: #fff;
    border-radius: 12rpx;
    box-shadow: 0rpx 0rpx 8rpx 0rpx rgba(0,0,0,.07);
    margin-top: 16rpx;
    padding: 36rpx 20rpx
}

.orderWrapper .orderInfo .title.data-v-389a9f20 {
    color: #333;
    font-size: 32rpx;
    font-weight: 600;
    height: 40rpx;
    line-height: 40rpx;
    text-align: left
}

.orderWrapper .orderInfo .listCon.data-v-389a9f20 {
    padding-top: 27rpx
}

.orderWrapper .orderInfo .listCon > wx-view.data-v-389a9f20 {
    height: 56rpx;
    line-height: 56rpx
}

.orderWrapper .orderInfo .listCon > wx-view .infoTitle.data-v-389a9f20 {
    color: #999;
    float: left;
    font-size: 28rpx
}

.orderWrapper .orderInfo .listCon > wx-view .infoIntro.data-v-389a9f20 {
    color: #333;
    float: left;
    font-size: 28rpx
}

.orderWrapper .orderInfo .listCon > wx-view .copy.data-v-389a9f20 {
    color: #ff4b33;
    float: right;
    font-size: 24rpx
}

.orderWrapper .orderInfo .listCon > wx-view.charge.active.data-v-389a9f20,.orderWrapper .orderInfo .listCon > wx-view.paytime.active.data-v-389a9f20 {
    display: none
}

.bottomBtn.data-v-389a9f20 {
    background: #fff;
    bottom: 0;
    position: fixed;
    width: 100%;
    z-index: 999
}

.bottomBtn .content.data-v-389a9f20 {
    display: -webkit-flex;
    display: flex;
    padding: 20rpx
}

.bottomBtn .content .price.data-v-389a9f20 {
    -webkit-flex: 1;
    flex: 1;
    height: 80rpx;
    line-height: 80rpx
}

.bottomBtn .content .price .nowPrice.data-v-389a9f20 {
    color: #ff6403;
    font-size: 28rpx;
    font-weight: 600
}

.bottomBtn .content .price .nowPrice wx-text.data-v-389a9f20 {
    font-size: 56rpx
}

.bottomBtn .content .price .officePrice.data-v-389a9f20 {
    color: #999;
    font-size: 24rpx;
    margin-left: 18rpx;
    text-decoration: line-through
}

.bottomBtn .content .payBtn .canclebtn.data-v-389a9f20 {
    border: 2rpx solid #fb5423;
    border-radius: 40rpx 0 0 40rpx;
    color: #fb5423;
    float: left;
    font-size: 26rpx;
    font-weight: 600;
    height: 80rpx;
    line-height: 80rpx;
    text-align: center;
    width: 210rpx
}

.bottomBtn .content .payBtn .onceBuy.data-v-389a9f20 {
    background: linear-gradient(113deg,#fc8233,#fb5423);
    border: 2rpx solid transparent;
    border-radius: 0 40rpx 40rpx 0;
    color: #fff;
    float: left;
    font-size: 26rpx;
    font-weight: 600;
    height: 80rpx;
    line-height: 80rpx;
    text-align: center;
    width: 210rpx
}

.bottomBtn.active.data-v-389a9f20 {
    display: none
}

.popWrapper.data-v-389a9f20 {
    height: 306rpx;
    width: 100%
}

.popWrapper .popContent.data-v-389a9f20 {
    border-radius: 32rpx;
    margin-top: 250rpx;
    padding: 65rpx 0;
    -webkit-transform: translateY(-50%);
    transform: translateY(-50%)
}

.popWrapper .popContent.data-v-389a9f20 .tki-qrcode {
    border-radius: 32rpx;
    margin-top: 30rpx;
    padding: 0 40rpx;
    text-align: center
}

.popWrapper .popContent.data-v-389a9f20 .tki-qrcode wx-image {
    height: 420rpx;
    width: 420rpx
}

.popWrapper .popContent.data-v-389a9f20 .tki-barcode {
    border-radius: 32rpx;
    padding: 0 40rpx
}

.popWrapper .popContent.data-v-389a9f20 .tki-barcode wx-image {
    height: 120rpx!important;
    width: 100%!important
}

.popWrapper.active.data-v-389a9f20 {
    display: none
}

.ercodeNumexchange.data-v-389a9f20 {
    color: #666;
    font-size: 32rpx;
    height: 40rpx;
    line-height: 40rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 70%
}

.copyexchange.data-v-389a9f20 {
    color: #ff4b33;
    display: inline-block;
    font-size: 28rpx;
    font-weight: 700;
    height: 40rpx;
    line-height: 40rpx;
    text-align: right;
    width: 30%
}
`;

  const convertedCss = useMemo(() => {
    let css = rawWxss
      .replace(/wx-image/g, "img")
      .replace(/wx-text/g, "span")
      .replace(/wx-view/g, "div");
    css = css.replace(/(\d+(?:\.\d+)?)rpx/g, "calc($1 * var(--rpx))");
    const helpers = `
      :root{ --rpx: calc(100vw / 750); }
      .clearfix::after{ content: ""; display: table; clear: both; }
      .fl{ float:left; }
      .fr{ float:right; }
      body{ background:#f5f5f5; }
    `;
    return helpers + "\n" + css;
  }, [rawWxss]);

  return (
    <div className="orderdtail data-v-389a9f20">
      <div className="orderWrapper data-v-389a9f20">
        {paybutton === 1 ? (
          <div className="orderStatus data-v-389a9f20">
            {orderCs}
            <span className="data-v-389a9f20">{rocallTime}</span>
          </div>
        ) : paybutton === 2 && isDestruction === 1 ? (
          <div className="orderStatus data-v-389a9f20">
            订单已支付
            <img
              className="data-v-389a9f20"
              src="https://ebk-picture.oss-cn-hangzhou.aliyuncs.com/mini-wx/images/common/arr1.png"
              alt="arrow"
            />
          </div>
        ) : paybutton === 3 ? (
          <div className="orderStatus data-v-389a9f20">
            订单已取消
            <img
              className="data-v-389a9f20"
              src="https://ebk-picture.oss-cn-hangzhou.aliyuncs.com/mini-wx/images/common/arr1.png"
              alt="arrow"
            />
          </div>
        ) : paybutton === 2 && isDestruction === 2 ? (
          <div className="orderStatus data-v-389a9f20">
            订单已核销
            <img
              className="data-v-389a9f20"
              src="https://ebk-picture.oss-cn-hangzhou.aliyuncs.com/mini-wx/images/common/arr1.png"
              alt="arrow"
            />
          </div>
        ) : paybutton === 9 ? (
          <div className="orderStatus data-v-389a9f20">
            订单已失效
            <img
              className="data-v-389a9f20"
              src="https://ebk-picture.oss-cn-hangzhou.aliyuncs.com/mini-wx/images/common/arr1.png"
              alt="arrow"
            />
          </div>
        ) : null}

        {paybutton === 1 && (
          <div className="nopayTips data-v-389a9f20">
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

        <div className="spinfo data-v-389a9f20">
          <a className="linkHref data-v-389a9f20" href="#">
            <div
              className="spimg data-v-389a9f20"
              style={{ backgroundImage: `url(${spinfo.spimg})` }}
            />
            <div className="spData data-v-389a9f20">
              <div className="spName data-v-389a9f20">{spinfo.spname}</div>
              <div className="spDetails data-v-389a9f20">
                <div className="oldPrice data-v-389a9f20">
                  售价：{spinfo.orginPrice}
                </div>
              </div>
            </div>
            <div className="allprice data-v-389a9f20" />
          </a>
        </div>

        <div className="hexiaoList data-v-389a9f20">
          {paybutton === 2 && isDestruction === 1 && (
            <div className="codetype data-v-389a9f20">
              <div className="listCon data-v-389a9f20" style={{ paddingTop: 30 }}>
                {cardNum && (
                  <div className="ercodetitle clearfix data-v-389a9f20">
                    <span className="hexiao fl data-v-389a9f20">卡号：</span>
                  </div>
                )}
                {cardNum && (
                  <div className="ercode clearfix data-v-389a9f20">
                    <span className="ercodeNum fl data-v-389a9f20">{cardNum}</span>
                    <span className="copy fr data-v-389a9f20">复制</span>
                  </div>
                )}

                <div
                  className="tishi data-v-389a9f20"
                  style={{
                    height: 60,
                    display: "flex",
                    background: "#FDEDED",
                    borderRadius: 20,
                    width: "90%",
                    margin: "0 auto",
                    paddingLeft: 20,
                  }}
                >
                  <img
                    className="data-v-389a9f20"
                    src="https://ebk-picture.oss-cn-hangzhou.aliyuncs.com/mini-wx/images/bargain/listen.png"
                    alt="sound"
                    style={{ width: 36, height: 36, marginTop: 13, marginRight: 4 }}
                  />
                  <span
                    className="data-v-389a9f20"
                    style={{ color: "#D35A5E", fontSize: 22, lineHeight: 2.2 as any }}
                  >
                    请提醒商家使用【DT生活核销小程序】验券核销
                  </span>
                </div>

                <div className="ercodetitle clearfix data-v-389a9f20">
                  {goodsCodeType === 1 ? (
                    <span className="hexiao fl data-v-389a9f20">卡密：</span>
                  ) : goodsCodeType === 2 ? (
                    <span className="hexiao fl data-v-389a9f20">核销码：</span>
                  ) : (
                    <span className="hexiao fl data-v-389a9f20">领取链接：</span>
                  )}
                </div>

                <div className="popContent data-v-389a9f20" style={{ display: "flex", justifyContent: "center" }}>
                  <div className="canvas data-v-389a9f20">
                    <div
                      className="data-v-389a9f20"
                      style={{ width: qrcodeSize, height: qrcodeSize, background: "#f5f5f5", borderRadius: 8 }}
                    />
                  </div>
                </div>

                {store_source_id !== 5 ? (
                  <div className="ercode clearfix last data-v-389a9f20" style={{ marginTop: 40 }}>
                    {goodsCodeType === 3 ? (
                      <a className="ercodeNum fl link data-v-389a9f20" href={goodsCode}>
                        {goodsCode}
                      </a>
                    ) : (
                      <span className="ercodeNum fl data-v-389a9f20">{goodsCode}</span>
                    )}
                    <span className="copy fr data-v-389a9f20">复制</span>
                  </div>
                ) : (
                  <div className="ercode clearfix last data-v-389a9f20" style={{ marginTop: 40 }}>
                    <span className="ercodeNumexchange fl data-v-389a9f20">{goodsCode}</span>
                    <span className="copyexchange data-v-389a9f20">请点击去核销</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {paybutton === 2 && isDestruction === 1 ? (
          <div className="useTips data-v-389a9f20">
            <img
              className="data-v-389a9f20"
              src="https://ebk-picture.oss-cn-hangzhou.aliyuncs.com/mini-wx/images/bargain/listen.png"
              alt="listen"
            />
            <div className="useType data-v-389a9f20">
              <span className="fl data-v-389a9f20">使用方法详见</span>
              <a className="link fl data-v-389a9f20" href="#">商品详情</a>，
              {useLink && (
                <span className="useType_url fl data-v-389a9f20">，使用请复制{useLink}</span>
              )}
              {useLink && <span className="copy fr data-v-389a9f20">复制</span>}
              <div className="data-v-389a9f20" style={{ clear: "both" }} />
            </div>
          </div>
        ) : (
          <div className="data-v-389a9f20" />
        )}

        <div className="orderInfo data-v-389a9f20">
          <div className="title data-v-389a9f20">订单信息</div>
          <div className="listCon data-v-389a9f20">
            <div className="clearfix data-v-389a9f20">
              <span className="infoTitle data-v-389a9f20">订单号码：</span>
              <span className="infoIntro data-v-389a9f20">{orderNum}</span>
              <span className="copy data-v-389a9f20">复制</span>
            </div>
            {time_valid ? (
              <div className="clearfix data-v-389a9f20">
                <span className="infoTitle data-v-389a9f20">有效期至：</span>
                <span className="infoIntro data-v-389a9f20">{time_valid}</span>
              </div>
            ) : (
              <span className="data-v-389a9f20" />
            )}
            <div className="clearfix paytime data-v-389a9f20">
              <span className="infoTitle data-v-389a9f20">原       价：</span>
              <span className="infoIntro data-v-389a9f20">¥{spinfo.orginPrice}</span>
            </div>
            {user_points == null ? (
              <div className="clearfix paytime data-v-389a9f20" />
            ) : (
              <div className="data-v-389a9f20">
                <span className="infoTitle data-v-389a9f20">抵扣积分：</span>
                <span className="infoIntro data-v-389a9f20">{user_points}</span>
              </div>
            )}
          </div>
        </div>

        {paybutton === 2 && isDestruction === 1 && (
          <div className="rules lists data-v-389a9f20">
            <div className="ruleList store data-v-389a9f20">
              <div className="titlename data-v-389a9f20">适用门店</div>
              <div className="data-v-389a9f20">
                <a className="useStore data-v-389a9f20" href={`useStore?storeId=${storeId}&goods_id=${goodsId}`}>
                  {useStoreNum}家店适用
                  <img
                    className="data-v-389a9f20"
                    src="https://ebk-picture.oss-cn-hangzhou.aliyuncs.com/mini-wx/images/common/arr1.png"
                    alt="arr"
                  />
                </a>
              </div>
            </div>
            <div className="data-v-389a9f20" style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
              <div className="titleContent data-v-389a9f20">
                <a className="useStore data-v-389a9f20" href={`useStore?storeId=${storeId}&goods_id=${goodsId}`}>
                  <span className="storeName data-v-389a9f20">{store_name}</span>
                  <span className="storeAddress data-v-389a9f20">{storeAddress}</span>
                </a>
              </div>
              <div className="data-v-389a9f20" style={{ marginLeft: 36, marginTop: 10 }}>
                <div
                  className="data-v-389a9f20"
                  style={{
                    color: "#E86E0F",
                    fontSize: 20,
                    lineHeight: 30,
                    marginRight: 10,
                    width: 108,
                    height: 30,
                    background: "#FFFEFC",
                    border: "1px solid #FFD7A8",
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    textAlign: "center",
                    borderBottomLeftRadius: 20,
                  }}
                >
                  商家电话
                </div>
                <img
                  className="data-v-389a9f20"
                  src="https://ebk-picture.oss-cn-hangzhou.aliyuncs.com/ebk-wap/img-202309060318386529-Group%2034149%403x.png"
                  alt="phone"
                  style={{ width: 60, height: 60, marginLeft: 80, marginTop: 10 }}
                />
              </div>
            </div>
          </div>
        )}

        {store_detail_data && (
          <div className="orderInfo data-v-389a9f20" id="section1">
            <div className="title data-v-389a9f20">套餐信息</div>
            <div className="detail_info data-v-389a9f20">
              {store_detail_data.map((item, i) => (
                <div className="data-v-389a9f20" key={i}>
                  <div className="two_detail data-v-389a9f20">
                    <span className="lable-point _span data-v-389a9f20" />
                    {item.store_goods_name}
                  </div>
                  {item.store_goods_content.map((store_list, j) => (
                    <div className="three_detail data-v-389a9f20" key={j}>
                      {store_list.map((st, k) => (
                        <div className="data-v-389a9f20" key={k}>
                          {st}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {!false && paybutton === 1 && (
        <div className="bottomBtn data-v-389a9f20">
          <div className="content data-v-389a9f20">
            <div className="price data-v-389a9f20">
              <span className="nowPrice data-v-389a9f20">
                ¥<span className="data-v-389a9f20">{spinfo.nowPrice}</span>
              </span>
              <span className="officePrice data-v-389a9f20">¥{spinfo.orginPrice}</span>
            </div>
            <div className="payBtn clearfix data-v-389a9f20">
              <div className="canclebtn data-v-389a9f20">取消订单</div>
              <div className="onceBuy data-v-389a9f20">立即支付</div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: convertedCss }} />
    </div>
  );
}
