const http = require('../../utils/request');
const { setToken } = require('../../utils/auth');

Page({
  data: {
    inviteCode: '',
    agreed: false,
    loading: false,
  },

  onInviteInput(e) {
    this.setData({ inviteCode: e.detail.value });
  },

  toggleAgreed() {
    this.setData({ agreed: !this.data.agreed });
  },

  onAgreementTap() {
    wx.navigateTo({ url: '/pages/agreement/agreement' });
  },

  onGuestLogin() {
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];
    if (prevPage) {
      wx.navigateBack();
    } else {
      wx.switchTab({ url: '/pages/index/index' });
    }
  },

  async onWxLogin() {
    const { agreed, inviteCode, loading } = this.data;
    if (loading) return;

    if (!agreed) {
      return wx.showToast({ title: '请先阅读并同意用户协议', icon: 'none' });
    }

    this.setData({ loading: true });
    try {
      // 获取微信登录 code
      const { code } = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject,
        });
      });

      const body = { code };
      if (inviteCode) body.inviteCode = inviteCode;

      // 调用后端微信登录接口
      const data = await http.post('/api/h5/auth/login', body);
      setToken(data.token);

      const app = getApp();
      app.globalData.userInfo = data.member;

      const pages = getCurrentPages();
      const prevPage = pages[pages.length - 2];
      if (prevPage) {
        wx.navigateBack();
      } else {
        wx.switchTab({ url: '/pages/mine/mine' });
      }
    } catch (err) {
      // 请求失败由 request.js 统一 toast，此处仅重置 loading
    } finally {
      this.setData({ loading: false });
    }
  },
});
