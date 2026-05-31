const http = require('../../utils/request');
const { isLoggedIn } = require('../../utils/auth');

Page({
  data: {
    product: null,
    quantity: 1,
    currentImg: 0,
    loading: true,
    /** 返回按钮距左边距（px） */
    navBackLeft: 16,
    /** 分享按钮距右边距（px）：紧靠系统胶囊左侧 */
    navShareRight: 100,
    /** 导航按钮顶部位置（px），与系统胶囊垂直居中对齐 */
    navBtnTop: 44,
    /** 导航按钮尺寸（px），与系统胶囊等高 */
    navBtnSize: 32,
    /** 控制数量选择弹窗 */
    showPopup: false,
    /** 弹窗确认后的行为：'buy' 立即购买 | 'cart' 加入购物袋 */
    popupAction: '',
  },

  onLoad(options) {
    this._initNavLayout();
    this.productId = options.id;
    this.loadProduct();
  },

  /**
   * 计算自定义导航按钮位置，使其与系统胶囊按钮垂直对齐
   * 分享按钮紧贴系统胶囊左侧，避免遮挡
   */
  _initNavLayout() {
    const sys = wx.getSystemInfoSync();
    const menuBtn = wx.getMenuButtonBoundingClientRect();
    const btnSize = menuBtn.height;
    const btnTop = menuBtn.top + (menuBtn.height - btnSize) / 2;
    // 分享按钮 right = 屏幕宽度 - 胶囊左边距 + 间距
    const shareRight = sys.screenWidth - menuBtn.left + 8;
    this.setData({
      navBackLeft: 16,
      navShareRight: shareRight,
      navBtnTop: btnTop,
      navBtnSize: btnSize,
    });
  },

  async loadProduct() {
    try {
      const product = await http.load(`/api/h5/products/${this.productId}`);
      this.setData({ product, loading: false });
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  onSwiperChange(e) {
    this.setData({ currentImg: e.detail.current });
  },

  onPreviewImg(e) {
    const { product } = this.data;
    wx.previewImage({
      current: e.currentTarget.dataset.src,
      urls: product.main_images,
    });
  },

  /** 返回上一页 */
  onBack() {
    wx.navigateBack();
  },

  /** 更多菜单 */
  onMore() {
    wx.showActionSheet({
      itemList: ['复制链接'],
      success() {},
    });
  },

  /** 跳转购物袋页面（待实现） */
  onCartTap() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  /** 数量减少 */
  onMinus() {
    if (this.data.quantity <= 1) return;
    this.setData({ quantity: this.data.quantity - 1 });
  },

  /** 数量增加 */
  onPlus() {
    const { quantity, product } = this.data;
    if (quantity >= product.stock) {
      return wx.showToast({ title: '库存不足', icon: 'none' });
    }
    this.setData({ quantity: quantity + 1 });
  },

  /** 点击「立即购买」：弹出数量选择 */
  onBuyNow() {
    if (!isLoggedIn()) {
      return wx.navigateTo({ url: '/pages/login/login' });
    }
    this.setData({ showPopup: true, popupAction: 'buy', quantity: 1 });
  },

  /** 点击「加入购物袋」：弹出数量选择 */
  onAddToCart() {
    if (!isLoggedIn()) {
      return wx.navigateTo({ url: '/pages/login/login' });
    }
    this.setData({ showPopup: true, popupAction: 'cart', quantity: 1 });
  },

  /** 关闭弹窗 */
  onClosePopup() {
    this.setData({ showPopup: false });
  },

  /** 弹窗确认 */
  async onConfirm() {
    const { product, quantity, popupAction } = this.data;
    this.setData({ showPopup: false });

    if (popupAction === 'buy') {
      wx.navigateTo({
        url: `/pages/checkout/checkout?productId=${product.id}&quantity=${quantity}`,
      });
    } else if (popupAction === 'cart') {
      try {
        await http.post('/api/h5/cart', { product_id: product.id, quantity });
        wx.showToast({ title: '已加入购物袋', icon: 'success' });
      } catch (e) {}
    }
  },

  /**
   * 分享配置：缩略图使用商品 cover 字段
   * @returns {WechatMiniprogram.Page.ICustomShareContent}
   */
  onShareAppMessage() {
    const { product } = this.data;
    return {
      title: product?.name || '好物推荐',
      imageUrl: product?.cover || '',
      path: `/pages/product-detail/product-detail?id=${this.productId}`,
    };
  },
});
