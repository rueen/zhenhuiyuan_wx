const http = require('../../utils/request');
const { isLoggedIn } = require('../../utils/auth');

Page({
  data: {
    hardwareEnabled: false,
    records: [],
    loading: true,
    userId: null,
    scrollHeight: 0,
  },

  onLoad() {
    wx.getSystemInfo({
      success: (res) => {
        // 导航栏高度约 44px + 状态栏，剩余高度留给滚动列表
        const navBarHeight = res.statusBarHeight + 44;
        this.setData({ scrollHeight: res.windowHeight - navBarHeight });
      },
    });
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
    const { item } = e.currentTarget.dataset;
    const baseUrl = 'https://iot.smfyunpingtai.com/jiayishen/#/pages/pulseReport/pulseReport';
    const url = `${baseUrl}?patno=${item.patno}`;
    wx.navigateTo({
      url: `/pages/webview/webview?title=${encodeURIComponent('体检报告')}&url=${encodeURIComponent(url)}`,
    });
  },

  onContactService() {
    wx.navigateTo({ url: '/pages/service/service' });
  },
});
