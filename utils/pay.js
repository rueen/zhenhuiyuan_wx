const http = require('./request');

/**
 * 调用后端支付接口并拉起微信收银台
 * @param {number|string} orderId - 订单 ID
 * @returns {Promise<void>} 支付成功时 resolve，用户取消或失败时 reject
 */
async function requestWxPay(orderId) {
  const payParams = await http.post(`/api/h5/orders/${orderId}/pay`);

  await new Promise((resolve, reject) => {
    wx.requestPayment({
      timeStamp: payParams.timeStamp,
      nonceStr:  payParams.nonceStr,
      package:   payParams.package,
      signType:  payParams.signType || 'RSA',
      paySign:   payParams.paySign,
      success:   resolve,
      fail:      reject,
    });
  });
}

module.exports = { requestWxPay };
