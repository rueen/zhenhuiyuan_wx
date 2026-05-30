const http = require('../../utils/request');

Page({
  data: {
    addresses: [],
    loading: false,
    selectMode: false,
  },

  onLoad(options) {
    this.selectMode = options.mode === 'select';
    this.setData({ selectMode: this.selectMode });
    if (this.selectMode) {
      wx.setNavigationBarTitle({ title: '选择收货地址' });
    }
  },

  onShow() {
    this.loadAddresses();
  },

  async loadAddresses() {
    this.setData({ loading: true });
    try {
      const list = await http.get('/api/h5/addresses');
      this.setData({ addresses: list || [] });
    } catch (e) {}
    this.setData({ loading: false });
  },

  onAdd() {
    wx.navigateTo({ url: '/pages/address-edit/address-edit' });
  },

  onEdit(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/address-edit/address-edit?id=${id}` });
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除地址',
      content: '确认删除此收货地址？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await http.delete(`/api/h5/addresses/${id}`);
            this.loadAddresses();
          } catch (err) {}
        }
      },
    });
  },

  async onSetDefault(e) {
    const id = e.currentTarget.dataset.id;
    try {
      await http.put(`/api/h5/addresses/${id}/default`);
      this.loadAddresses();
    } catch (err) {}
  },

  onSelect(e) {
    if (!this.selectMode) return;
    const id = e.currentTarget.dataset.id;
    const addr = this.data.addresses.find(a => a.id === id);
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];
    if (prevPage) {
      const eventChannel = this.getOpenerEventChannel();
      eventChannel.emit('selectAddress', addr);
    }
    wx.navigateBack();
  },
});
