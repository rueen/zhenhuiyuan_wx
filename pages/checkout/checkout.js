const http = require('../../utils/request');

Page({
  data: {
    product: null,
    quantity: 1,
    addresses: [],
    selectedAddress: null,
    preview: null,
    submitting: false,
  },

  onLoad(options) {
    this.productId = options.productId;
    this.setData({ quantity: parseInt(options.quantity) || 1 });
    this.init();
  },

  async init() {
    wx.showLoading({ title: '加载中', mask: true });
    try {
      const [product, addresses] = await Promise.all([
        http.get(`/api/h5/products/${this.productId}`),
        http.get('/api/h5/addresses'),
      ]);
      const defaultAddr = addresses.find(a => a.is_default) || addresses[0] || null;
      this.setData({ product, addresses, selectedAddress: defaultAddr });
      if (defaultAddr) this.refreshPreview();
    } catch (e) {}
    wx.hideLoading();
  },

  async refreshPreview() {
    const { selectedAddress, quantity } = this.data;
    const body = {
      items: [{ product_id: this.productId, quantity }],
    };
    if (selectedAddress) body.address_id = selectedAddress.id;
    try {
      const preview = await http.post('/api/h5/orders/preview', body);
      this.setData({ preview });
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
    const { selectedAddress, quantity, submitting } = this.data;
    if (submitting) return;
    if (!selectedAddress) {
      return wx.showToast({ title: '请选择收货地址', icon: 'none' });
    }
    this.setData({ submitting: true });
    try {
      const order = await http.post('/api/h5/orders', {
        items: [{ product_id: this.productId, quantity }],
        address_id: selectedAddress.id,
      });
      wx.redirectTo({ url: `/pages/order-detail/order-detail?id=${order.id}` });
    } finally {
      this.setData({ submitting: false });
    }
  },
});
