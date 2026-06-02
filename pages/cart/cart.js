const http = require('../../utils/request');
const { isLoggedIn } = require('../../utils/auth');

Page({
  data: {
    items: [],
    totalQuantity: 0,
    loading: true,
    selectAll: false,
    selectedItemCount: 0,
    selectedCount: 0,
    selectedAmount: '0.00',
    /** 数量编辑弹窗 */
    showPopup: false,
    editInitial: 1,
    popupProduct: {},
  },

  onLoad() {
    if (!isLoggedIn()) {
      return wx.redirectTo({ url: '/pages/login/login' });
    }
    // rpx → px 比例，用于滑动删除位移计算
    const ratio = wx.getSystemInfoSync().windowWidth / 750;
    this.swipePx = 320 * ratio; // 两个操作按钮共 320rpx
  },

  onShow() {
    if (isLoggedIn()) this.loadCart();
  },

  async loadCart() {
    const prevChecked = {};
    const hadData = this.data.items.length > 0;
    this.data.items.forEach(i => { if (i.checked) prevChecked[i.id] = true; });

    try {
      const res = await http.get('/api/h5/cart');
      const items = (res.items || []).map(it => ({
        ...it,
        offset: 0,
        checked: it.invalid ? false : (hadData ? !!prevChecked[it.id] : true),
      }));
      this.setData({ items, totalQuantity: res.total_quantity || 0, loading: false });
      this._computeSummary();
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  _computeSummary() {
    const { items } = this.data;
    const valid = items.filter(i => !i.invalid);
    const checked = valid.filter(i => i.checked);
    const selectedAmount = checked
      .reduce((sum, i) => sum + parseFloat(i.subtotal || 0), 0)
      .toFixed(2);
    this.setData({
      selectAll: valid.length > 0 && checked.length === valid.length,
      selectedItemCount: checked.length,
      selectedCount: checked.reduce((sum, i) => sum + i.quantity, 0),
      selectedAmount,
    });
  },

  /** 勾选/取消单项 */
  onToggleItem(e) {
    const { index } = e.currentTarget.dataset;
    const item = this.data.items[index];
    if (item.invalid) return;
    this.setData({ [`items[${index}].checked`]: !item.checked });
    this._computeSummary();
  },

  /** 全选/取消全选 */
  onToggleAll() {
    const next = !this.data.selectAll;
    const patch = {};
    this.data.items.forEach((i, idx) => {
      if (!i.invalid) patch[`items[${idx}].checked`] = next;
    });
    this.setData(patch);
    this._computeSummary();
  },

  /* ── 滑动删除 ── */
  onTouchStart(e) {
    const { index } = e.currentTarget.dataset;
    this._startX = e.touches[0].clientX;
    this._startOffset = this.data.items[index].offset;
  },

  onTouchMove(e) {
    const { index } = e.currentTarget.dataset;
    const delta = e.touches[0].clientX - this._startX;
    let offset = this._startOffset + delta;
    if (offset > 0) offset = 0;
    if (offset < -this.swipePx) offset = -this.swipePx;
    this.setData({ [`items[${index}].offset`]: offset });
  },

  onTouchEnd(e) {
    const { index } = e.currentTarget.dataset;
    const open = this.data.items[index].offset < -this.swipePx / 2;
    this._closeAllSwipe(open ? index : -1);
    this.setData({ [`items[${index}].offset`]: open ? -this.swipePx : 0 });
  },

  _closeAllSwipe(except) {
    const patch = {};
    this.data.items.forEach((i, idx) => {
      if (idx !== except && i.offset !== 0) patch[`items[${idx}].offset`] = 0;
    });
    if (Object.keys(patch).length) this.setData(patch);
  },

  /** 点击商品：若处于滑动态先收起，否则跳详情 */
  onItemTap(e) {
    const { index } = e.currentTarget.dataset;
    const item = this.data.items[index];
    if (item.offset !== 0) {
      this.setData({ [`items[${index}].offset`]: 0 });
      return;
    }
    wx.navigateTo({ url: `/pages/product-detail/product-detail?id=${item.product_id}` });
  },

  /** 打开数量编辑弹窗（铅笔 / 滑动「编辑」） */
  onEditItem(e) {
    const { index } = e.currentTarget.dataset;
    const item = this.data.items[index];
    if (item.invalid) return;
    this._closeAllSwipe(-1);
    this.editId = item.id;
    this.setData({
      showPopup: true,
      editInitial: item.quantity,
      popupProduct: {
        cover: item.product_cover,
        name: item.product_name,
        price: item.price,
        stock: item.stock,
      },
    });
  },

  onClosePopup() {
    this.setData({ showPopup: false });
  },

  async onPopupConfirm(e) {
    const { quantity } = e.detail;
    this.setData({ showPopup: false });
    try {
      await http.put(`/api/h5/cart/${this.editId}`, { quantity });
      this.loadCart();
    } catch (err) {}
  },

  /** 删除单项 */
  async onDeleteItem(e) {
    const { index } = e.currentTarget.dataset;
    const item = this.data.items[index];
    const res = await wx.showModal({ title: '提示', content: '确定移出购物袋？' });
    if (!res.confirm) return;
    try {
      await http.delete(`/api/h5/cart/${item.id}`);
      this.loadCart();
    } catch (err) {}
  },

  /** 去结算 */
  onCheckout() {
    const selected = this.data.items.filter(i => !i.invalid && i.checked);
    if (!selected.length) {
      return wx.showToast({ title: '请选择商品', icon: 'none' });
    }
    const ids = selected.map(i => i.id).join(',');
    wx.navigateTo({ url: `/pages/checkout/checkout?cartItemIds=${ids}` });
  },
});
