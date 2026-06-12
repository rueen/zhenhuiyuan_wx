/** @type {string} 客服电话 */
const SERVICE_PHONE = '4000776118';

Page({
  data: {
    servicePhone: SERVICE_PHONE,
  },

  /**
   * 拨打客服电话
   */
  onCallPhone() {
    wx.makePhoneCall({ phoneNumber: SERVICE_PHONE });
  },
});
