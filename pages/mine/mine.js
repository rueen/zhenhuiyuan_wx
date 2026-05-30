const http = require('../../utils/request');
const { isLoggedIn } = require('../../utils/auth');

Page({
  data: {
    profile: null,
    orderTabs: [
      { status: 0, label: '待付款' },
      { status: 1, label: '待发货' },
      { status: 2, label: '待收货' },
      { status: 3, label: '已完成' },
    ],
    menuItems: [
      { label: '我的团队',   path: '/pages/team/team',                   dot: false },
      { label: '我的地址',   path: '/pages/address-list/address-list',    dot: false },
      { label: '余额流水',   path: '/pages/balance-logs/balance-logs',    dot: false },
    ],
  },

  onShow() {
    if (typeof this.getTabBar === 'function') {
      this.getTabBar().setData({ selected: 2 });
    }
    if (isLoggedIn()) {
      this.loadProfile();
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

  onLoginTap() {
    wx.navigateTo({ url: '/pages/login/login' });
  },

  onCopyInviteCode() {
    wx.setClipboardData({
      data: this.data.profile.invite_code,
      success() { wx.showToast({ title: '邀请码已复制', icon: 'success' }); },
    });
  },

  onOrderTabTap(e) {
    const status = e.currentTarget.dataset.status;
    wx.navigateTo({ url: `/pages/order-list/order-list?status=${status}` });
  },

  onAllOrdersTap() {
    wx.navigateTo({ url: '/pages/order-list/order-list' });
  },

  onMenuTap(e) {
    wx.navigateTo({ url: e.currentTarget.dataset.path });
  },

  onWithdrawTap() {
    wx.navigateTo({ url: '/pages/withdrawal/withdrawal' });
  },

  onContributionTap() {
    wx.navigateTo({ url: '/pages/contribution-logs/contribution-logs' });
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
