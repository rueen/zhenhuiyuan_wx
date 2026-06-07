const http = require('../../utils/request');
const { uploadImage } = require('../../utils/upload');

Page({
  data: {
    form: {
      nickname: '',
      phone: '',
      avatar: '',
    },
    memberDate: '',
    avatarChanged: false,
    submitting: false,
  },

  onLoad() {
    const app = getApp();
    const profile = app.globalData.userInfo;
    if (profile) {
      this._initForm(profile);
    }
  },

  _initForm(profile) {
    const memberDate = profile.created_at
      ? profile.created_at.slice(0, 10).replace(/-/g, '-')
      : '';
    this.setData({
      form: {
        nickname: profile.nickname || '',
        phone: profile.phone || '',
        avatar: profile.avatar || '',
      },
      memberDate,
    });
  },

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

  async onSave() {
    const { nickname } = this.data.form;
    if (!nickname.trim()) {
      wx.showToast({ title: '昵称不能为空', icon: 'none' });
      return;
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

      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1000);
    } catch (e) {
      // request.js 已统一 toast，无需重复处理
    } finally {
      this.setData({ submitting: false });
    }
  },
});
