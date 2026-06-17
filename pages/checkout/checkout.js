const http = require('../../utils/request');
const { requestWxPay } = require('../../utils/pay');

Page({
  data: {
    items: [],
    addresses: [],
    selectedAddress: null,
    preview: null,
    submitting: false,
  },

  onLoad(options) {
    if (options.cartItemIds) {
      this.mode = 'cart';
      this.cartItemIds = options.cartItemIds.split(',').map(Number);
    } else {
      this.mode = 'single';
      this.productId = options.productId;
      this.quantity = parseInt(options.quantity) || 1;
    }
    this.init();
  },

  /** 构造下单/预览的商品入参（两种来源二选一） */
  _orderBody() {
    return this.mode === 'cart'
      ? { cart_item_ids: this.cartItemIds }
      : { items: [{ product_id: this.productId, quantity: this.quantity }] };
  },

  async init() {
    wx.showLoading({ title: '加载中', mask: true });
    try {
      const addresses = await http.get('/api/h5/addresses');
      const defaultAddr = addresses.find(a => a.is_default) || addresses[0] || null;
      this.setData({ addresses, selectedAddress: defaultAddr });
      await this.refreshPreview();
    } catch (e) {}
    wx.hideLoading();
  },

  async refreshPreview() {
    const { selectedAddress } = this.data;
    const body = this._orderBody();
    if (selectedAddress) body.address_id = selectedAddress.id;
    try {
      const preview = await http.post('/api/h5/orders/preview', body);
      this.setData({ preview, items: preview.items || [] });
    } catch (e) {}
  },

  onChooseAddress() {
    wx.navigateTo({
      url: '/pages/address-list/address-list?mode=select',
      events: {
        selectAddress: (addr) => {
          this.setData({ selectedAddress: addr });
          this.refreshPreview();
        },
      },
    });
  },

  async onSubmit() {
    const { selectedAddress, submitting } = this.data;
    if (submitting) return;
    if (!selectedAddress) {
      return wx.showToast({ title: '请选择收货地址', icon: 'none' });
    }
    this.setData({ submitting: true });
    try {
      // 1. 若已有待付款订单（取消支付后重试），直接复用，跳过创建步骤
      let orderId = this._pendingOrderId;
      if (!orderId) {
        const body = this._orderBody();
        body.address_id = selectedAddress.id;
        const order = await http.post('/api/h5/orders', body);
        orderId = order.id;
        this._pendingOrderId = orderId;
      }

      // 2. 调起微信收银台
      await requestWxPay(orderId);

      // 3. 支付成功，清除缓存订单 ID，跳转订单详情
      this._pendingOrderId = null;
      wx.redirectTo({ url: `/pages/order-detail/order-detail?id=${orderId}` });
    } catch (err) {
      const errMsg = (err && err.errMsg) || '';
      if (errMsg.includes('cancel')) {
        // 用户主动取消支付：保留待付款订单，navigateTo 保留页面栈方便重试
        wx.redirectTo({ url: `/pages/order-detail/order-detail?id=${this._pendingOrderId}` });
      } else if (this._pendingOrderId) {
        // 支付接口报错：提示后跳转订单详情
        wx.showToast({ title: '支付失败，请重试', icon: 'none' });
        wx.redirectTo({ url: `/pages/order-detail/order-detail?id=${this._pendingOrderId}` });
      }
      // 创建订单失败时 _pendingOrderId 为空，由 request.js 统一 toast，不额外跳转
    } finally {
      this.setData({ submitting: false });
    }
  },
});
