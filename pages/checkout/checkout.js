const http = require('../../utils/request');

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
      const body = this._orderBody();
      body.address_id = selectedAddress.id;
      const order = await http.post('/api/h5/orders', body);
      wx.redirectTo({ url: `/pages/order-detail/order-detail?id=${order.id}` });
    } finally {
      this.setData({ submitting: false });
    }
  },
});
