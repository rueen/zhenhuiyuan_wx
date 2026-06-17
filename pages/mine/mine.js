const http = require('../../utils/request');
const { isLoggedIn } = require('../../utils/auth');

Page({
  data: {
    profile: null,
    orderTabs: [
      { status: 0, label: '待付款', icon: 'daifukuan' },
      { status: 1, label: '待发货', icon: 'daifahuo' },
      { status: 2, label: '待收货', icon: 'daishouhuo' },
    ],
    menuItems: [
      { label: '我的团队',        path: '/pages/team/team',                 auth: true  },
      { label: '我的地址',        path: '/pages/address-list/address-list', auth: true  },
      // { label: '我的分红',        path: '/pages/dividend/dividend',         auth: true  },
      { label: '用户协议与隐私条款', path: '/pages/agreement/agreement',      auth: false },
      { label: '联系客服',        path: '/pages/service/service',           auth: false },
    ],
  },

  onShow() {
    if (typeof this.getTabBar === 'function') {
      this.getTabBar().setData({ selected: 3 });
    }
    if (isLoggedIn()) {
      this.loadProfile();
      this.loadStatusCount();
    } else {
      this.setData({ profile: null });
    }
  },

  async loadProfile() {
    try {
      const profile = await http.get('/api/h5/auth/profile');
      this.setData({ profile });
      const app = getApp();
      app.globalData.userInfo = profile;
    } catch (e) {}
  },

  async loadStatusCount() {
    try {
      const res = await http.get('/api/h5/orders/status-count');
      const orderTabs = this.data.orderTabs.map(t => ({
        ...t,
        count: res[String(t.status)] || 0,
      }));
      this.setData({ orderTabs });
    } catch (e) {}
  },

  _requireLogin() {
    if (!isLoggedIn()) {
      wx.navigateTo({ url: '/pages/login/login' });
      return false;
    }
    return true;
  },

  onUserAreaTap() {
    if (!isLoggedIn()) {
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    wx.navigateTo({ url: '/pages/profile-edit/profile-edit' });
  },

  onCopyInviteCode() {
    wx.navigateTo({ url: '/pages/invite/invite' });
  },

  onOrderTabTap(e) {
    if (!this._requireLogin()) return;
    const status = e.currentTarget.dataset.status;
    wx.navigateTo({ url: `/pages/order-list/order-list?status=${status}` });
  },

  onAllOrdersTap() {
    if (!this._requireLogin()) return;
    wx.navigateTo({ url: '/pages/order-list/order-list' });
  },

  onMenuTap(e) {
    const { path, auth } = e.currentTarget.dataset;
    if (auth && !this._requireLogin()) return;
    wx.navigateTo({ url: path });
  },

  onWithdrawTap() {
    if (!this._requireLogin()) return;
    wx.navigateTo({ url: '/pages/withdrawal/withdrawal' });
  },

  onContributionTap() {
    if (!this._requireLogin()) return;
    wx.navigateTo({ url: '/pages/contribution-logs/contribution-logs' });
  },

  onLevelTap() {
    wx.navigateTo({ url: '/pages/level-intro/level-intro' });
  },

  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '退出登录后需重新登录',
      success: (res) => {
        if (res.confirm) getApp().logout();
      },
    });
  },
});
