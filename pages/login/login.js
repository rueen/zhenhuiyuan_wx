const http = require('../../utils/request');
const { setToken } = require('../../utils/auth');
const { uploadImage } = require('../../utils/upload');

Page({
  data: {
    step: 'login',          // 'login' 登录 | 'register' 完善信息完成注册
    inviteCode: '',
    agreed: false,
    loading: false,
    // 注册完善信息表单
    form: {
      nickname: '',
      phone: '',
      avatar: '',
    },
    avatarChanged: false,
    submitting: false,
  },

  onLoad(options) {
    if (options.invite_code) {
      this.setData({ inviteCode: options.invite_code });
    }
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
    this._navAfterAuth();
  },

  _navAfterAuth() {
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];
    if (prevPage) {
      wx.navigateBack();
    } else {
      wx.switchTab({ url: '/pages/home/home' });
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

      // 新注册用户：进入完善信息流程
      if (data.isNew) {
        this.setData({
          step: 'register',
          loading: false,
          form: {
            nickname: '',
            phone: data.member.phone || '',
            avatar: data.member.avatar || '',
          },
        });
        return;
      }

      this._navAfterAuth();
    } catch (err) {
      // 请求失败由 request.js 统一 toast，此处仅重置 loading
    } finally {
      this.setData({ loading: false });
    }
  },

  /* ── 注册完善信息 ── */
  onChooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempPath = res.tempFiles[0].tempFilePath;
        this.setData({ 'form.avatar': tempPath, avatarChanged: true });
      },
    });
  },

  onNicknameInput(e) {
    this.setData({ 'form.nickname': e.detail.value });
  },

  async onGetPhoneNumber(e) {
    if (e.detail.errMsg !== 'getPhoneNumber:ok') return;
    try {
      const res = await http.post('/api/h5/member/decrypt-phone', { code: e.detail.code });
      this.setData({ 'form.phone': res.phone });
      const app = getApp();
      if (app.globalData.userInfo) {
        app.globalData.userInfo.phone = res.phone;
      }
      wx.showToast({ title: '手机号绑定成功', icon: 'success' });
    } catch (e) {
      // request.js 已统一 toast
    }
  },

  async onCompleteRegister() {
    const { nickname } = this.data.form;
    if (this.data.submitting) return;
    if (!nickname.trim()) {
      return wx.showToast({ title: '请输入昵称', icon: 'none' });
    }

    this.setData({ submitting: true });
    try {
      let avatarUrl = this.data.form.avatar;
      if (this.data.avatarChanged) {
        avatarUrl = await uploadImage(this.data.form.avatar, 'avatar');
      }

      await http.put('/api/h5/member/profile', {
        nickname: nickname.trim(),
        avatar: avatarUrl,
      });

      const app = getApp();
      if (app.globalData.userInfo) {
        app.globalData.userInfo.nickname = nickname.trim();
        app.globalData.userInfo.avatar = avatarUrl;
      }

      wx.showToast({ title: '注册成功', icon: 'success' });
      setTimeout(() => this._navAfterAuth(), 800);
    } catch (e) {
      // request.js 已统一 toast
    } finally {
      this.setData({ submitting: false });
    }
  },
});
