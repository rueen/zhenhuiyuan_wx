const { getToken, clearToken } = require('./utils/auth');

App({
  globalData: {
    userInfo: null,
    systemInfo: null,
  },

  onLaunch() {
    this.globalData.systemInfo = wx.getSystemInfoSync();
  },

  logout() {
    clearToken();
    this.globalData.userInfo = null;
    wx.reLaunch({ url: '/pages/login/login' });
  },

  requireAuth(successCb) {
    if (getToken()) {
      successCb && successCb();
    } else {
      wx.navigateTo({ url: '/pages/login/login' });
    }
  },
});
