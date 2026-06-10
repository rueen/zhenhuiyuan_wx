const http = require('../../utils/request');
const { isLoggedIn } = require('../../utils/auth');

Page({
  data: {
    hardwareEnabled: false,
    records: [],
    loading: true,
    userId: null,
  },

  onShow() {
    if (typeof this.getTabBar === 'function') {
      this.getTabBar().setData({ selected: 2 });
    }
    if (!isLoggedIn()) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    this.init();
  },

  async init() {
    this.setData({ loading: true });
    try {
      const profile = await http.get('/api/h5/auth/profile');
      const hardwareEnabled = !!profile.hardware_enabled;
      this.setData({ hardwareEnabled, userId: profile.id });
      if (hardwareEnabled) {
        await this.loadRecords(profile.id);
      }
    } catch (e) {}
    this.setData({ loading: false });
  },

  async loadRecords(userId) {
    try {
      const res = await http.get(`/api/h5/health-records`);
      this.setData({ records: res.list || [] });
    } catch (e) {}
  },

  onRecordTap(e) {
    const { patno } = e.currentTarget.dataset;
    const baseUrl = 'https://iot.smfyunpingtai.com/jiayishen/#/pages/pulseReport/pulseReport';
    const url = `${baseUrl}?patno=${patno}`;
    wx.navigateTo({
      url: `/pages/webview/webview?url=${encodeURIComponent(url)}`,
    });
  },

  onContactService() {
    wx.navigateTo({ url: '/pages/service/service' });
  },
});
