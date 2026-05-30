const http = require('../../utils/request');
const { setToken } = require('../../utils/auth');

Page({
  data: {
    phone: '',
    password: '',
    inviteCode: '',
    showInvite: false,
    loading: false,
  },

  onPhoneInput(e)    { this.setData({ phone: e.detail.value }); },
  onPasswordInput(e) { this.setData({ password: e.detail.value }); },
  onInviteInput(e)   { this.setData({ inviteCode: e.detail.value }); },

  toggleInvite() {
    this.setData({ showInvite: !this.data.showInvite });
  },

  async onLogin() {
    const { phone, password, inviteCode, loading } = this.data;
    if (loading) return;

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
    }
    if (password.length < 6) {
      return wx.showToast({ title: '密码不少于6位', icon: 'none' });
    }

    this.setData({ loading: true });
    try {
      const body = { phone, password };
      if (inviteCode) body.inviteCode = inviteCode;

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
    } finally {
      this.setData({ loading: false });
    }
  },
});
