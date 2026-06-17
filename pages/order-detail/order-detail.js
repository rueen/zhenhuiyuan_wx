const http = require('../../utils/request');
const { ORDER_STATUS } = require('../../utils/constant');
const { requestWxPay } = require('../../utils/pay');

Page({
  data: {
    order: null,
    loading: true,
    submitting: false,
  },

  onLoad(options) {
    this.orderId = options.id;
    this.loadOrder();
  },

  async loadOrder() {
    try {
      const order = await http.load(`/api/h5/orders/${this.orderId}`);
      order.statusText = ORDER_STATUS[order.status] || '';
      this.setData({ order, loading: false });
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  async onPay() {
    if (this.data.submitting) return;

    wx.showModal({
      title: '确认支付',
      content: '确认支付此订单？',
      success: async (res) => {
        if (!res.confirm) return;
        this.setData({ submitting: true });
        try {
          await requestWxPay(this.orderId);
          wx.showToast({ title: '支付成功', icon: 'success' });
          this.loadOrder();
        } catch (err) {
          const errMsg = (err && err.errMsg) || '';
          if (!errMsg.includes('cancel')) {
            wx.showToast({ title: '支付失败，请重试', icon: 'none' });
          }
        } finally {
          this.setData({ submitting: false });
        }
      },
    });
  },

  async onCancel() {
    wx.showModal({
      title: '取消订单',
      content: '确认取消此订单？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await http.post(`/api/h5/orders/${this.orderId}/cancel`);
            wx.showToast({ title: '已取消', icon: 'success' });
            this.loadOrder();
          } catch (e) {}
        }
      },
    });
  },

  onCopyNo() {
    wx.setClipboardData({
      data: this.data.order.order_no,
      success() { wx.showToast({ title: '已复制', icon: 'success' }); },
    });
  },

  onViewTrack(e) {
    const shipmentId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/logistics/logistics?orderId=${this.orderId}&shipmentId=${shipmentId}`,
    });
  },
});
