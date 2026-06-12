const http = require('../../utils/request');

Page({
  data: {
    profile: null,
    qrcodeUrl: '',
    qrcodeLoading: true,
    hasInviteAccess: false,
  },

  onLoad() {
    const profile = getApp().globalData.userInfo;
    if (profile) {
      const hasInviteAccess = !!profile.first_consumed_at;
      this.setData({ profile, hasInviteAccess });
      if (hasInviteAccess) {
        this.loadQrCode();
      }
    }
  },

  async loadQrCode() {
    const { profile } = this.data;
    try {
      const res = await http.get('/api/h5/member/qrcode', { path: `/pages/login/login?invite_code=${profile?.invite_code || ''}`});
      this.setData({ qrcodeUrl: res.url, qrcodeLoading: false });
    } catch (e) {
      this.setData({ qrcodeLoading: false });
    }
  },

  // 分享给好友，携带邀请码进入登录页
  onShareAppMessage() {
    const { profile } = this.data;
    return {
      title: `${profile?.nickname || '好友'}邀请您加入 贞慧缘`,
      path: `/pages/login/login?invite_code=${profile?.invite_code || ''}`,
      imageUrl: this.data.qrcodeUrl || '',
    };
  },

  // 下载海报到相册
  onDownloadPoster() {
    if (!this.data.qrcodeUrl) {
      wx.showToast({ title: '小程序码加载中，请稍候', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '生成海报…', mask: true });
    const query = wx.createSelectorQuery().in(this);
    query.select('#poster-canvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        const canvas = res[0]?.node;
        if (!canvas) {
          wx.hideLoading();
          wx.showToast({ title: '生成失败', icon: 'none' });
          return;
        }
        this._drawAndSavePoster(canvas).catch(() => {
          wx.hideLoading();
          wx.showToast({ title: '生成海报失败', icon: 'none' });
        });
      });
  },

  async _drawAndSavePoster(canvas) {
    const { profile, qrcodeUrl } = this.data;
    const dpr = wx.getSystemInfoSync().pixelRatio;
    const W = 600, H = 850;

    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // 白色背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // 头像
    const cx = W / 2, cy = 90, r = 52;
    if (profile.avatar) {
      const img = canvas.createImage();
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
        img.src = profile.avatar;
      });
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
      ctx.restore();
    } else {
      ctx.fillStyle = '#e8e8e8';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 邀请文案
    ctx.fillStyle = '#888888';
    ctx.font = '26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${profile.nickname || '好友'}邀请您加入 贞慧缘`, W / 2, cy + r + 48);

    // 小程序码
    const qrImg = canvas.createImage();
    await new Promise((resolve) => {
      qrImg.onload = resolve;
      qrImg.onerror = resolve;
      qrImg.src = qrcodeUrl;
    });
    const qrSize = 340;
    ctx.drawImage(qrImg, (W - qrSize) / 2, 220, qrSize, qrSize);

    // 邀请码文字
    ctx.fillStyle = '#888888';
    ctx.font = '26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`邀请码：${profile.invite_code || ''}`, W / 2, 630);

    // 导出并保存
    await new Promise((resolve, reject) => {
      wx.canvasToTempFilePath({
        canvas,
        success: (res) => {
          wx.hideLoading();
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              wx.showToast({ title: '已保存到相册', icon: 'success' });
              resolve();
            },
            fail: () => {
              wx.showModal({
                title: '保存失败',
                content: '请在系统设置中开启相册权限',
                confirmText: '去设置',
                showCancel: false,
                success: (r) => { if (r.confirm) wx.openSetting(); },
              });
              resolve();
            },
          });
        },
        fail: reject,
      });
    });
  },

  // 复制邀请码
  onCopyCode() {
    const code = this.data.profile?.invite_code;
    if (!code) return;
    wx.setClipboardData({
      data: code,
      success: () => wx.showToast({ title: '邀请码已复制', icon: 'success' }),
    });
  },

  // 去商店逛一逛
  onGoToShop() {
    wx.switchTab({ url: '/pages/shop/shop' });
  },
});
