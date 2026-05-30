const http = require('../../utils/request');
const { isLoggedIn } = require('../../utils/auth');

Page({
  data: {
    product: null,
    quantity: 1,
    currentImg: 0,
    loading: true,
    total: '0.00',
  },

  onLoad(options) {
    this.productId = options.id;
    this.loadProduct();
  },

  async loadProduct() {
    try {
      const product = await http.load(`/api/h5/products/${this.productId}`);
      const total = (parseFloat(product.price) * this.data.quantity).toFixed(2);
      this.setData({ product, total, loading: false });
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
      urls: product.detail_images,
    });
  },

  updateTotal(quantity) {
    const price = parseFloat(this.data.product.price) || 0;
    this.setData({ total: (price * quantity).toFixed(2) });
  },

  onMinus() {
    if (this.data.quantity <= 1) return;
    const quantity = this.data.quantity - 1;
    this.setData({ quantity });
    this.updateTotal(quantity);
  },

  onPlus() {
    const { quantity, product } = this.data;
    if (quantity >= product.stock) {
      return wx.showToast({ title: '库存不足', icon: 'none' });
    }
    const next = quantity + 1;
    this.setData({ quantity: next });
    this.updateTotal(next);
  },

  onQuantityInput(e) {
    let val = parseInt(e.detail.value) || 1;
    val = Math.max(1, Math.min(val, this.data.product.stock));
    this.setData({ quantity: val });
    this.updateTotal(val);
  },

  onBuyNow() {
    if (!isLoggedIn()) {
      return wx.navigateTo({ url: '/pages/login/login' });
    }
    const { product, quantity } = this.data;
    wx.navigateTo({
      url: `/pages/checkout/checkout?productId=${product.id}&quantity=${quantity}`,
    });
  },
});
