const http = require('../../utils/request');

Page({
  data: {
    info: null,
    loading: true,
  },

  onLoad(options) {
    this.orderId = options.orderId;
    this.shipmentId = options.shipmentId;
    this.loadTrack();
  },

  async loadTrack() {
    try {
      const info = await http.load(`/api/h5/orders/${this.orderId}/shipments/${this.shipmentId}/track`);
      info.tracks = (info.tracks || []).slice();
      this.setData({ info, loading: false });
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  onCopyNo() {
    if (!this.data.info) return;
    wx.setClipboardData({
      data: this.data.info.tracking_no,
      success() { wx.showToast({ title: '已复制', icon: 'success' }); },
    });
  },
});
