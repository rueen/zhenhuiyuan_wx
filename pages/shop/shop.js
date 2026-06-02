const http = require('../../utils/request');
const { isLoggedIn } = require('../../utils/auth');

Page({
  data: {
    categories: [],
    products: [],
    activeCategoryId: null,
    activeCategoryName: '',
    keyword: '',
    page: 1,
    pageSize: 10,
    total: 0,
    loading: false,
    noMore: false,
    showPopup: false,
    popupProduct: {},
  },

  onLoad() {
    
  },

  onShow() {
    if (typeof this.getTabBar === 'function') {
      this.getTabBar().setData({ selected: 1 });
    }
    if (this.data.categories.length === 0) {
      this.loadCategories();
    }
  },

  async loadCategories() {
    try {
      const list = await http.get('/api/h5/categories');
      const categories = list || [];
      const first = categories[0] || {};
      this.setData({
        categories,
        activeCategoryId: first.id ?? null,
        activeCategoryName: first.name || '',
      });
      this.loadProducts(true);
    } catch (e) {}
  },

  async loadProducts(reset = false) {
    if (this.data.loading) return;
    if (!reset && this.data.noMore) return;

    const page = reset ? 1 : this.data.page + 1;
    this.setData({ loading: true });

    try {
      const { activeCategoryId, keyword, pageSize } = this.data;
      const query = { page, pageSize };
      if (activeCategoryId) query.categoryId = activeCategoryId;
      if (keyword) query.keyword = keyword;

      const res = await http.get('/api/h5/products', query);
      const newList = res.list || [];
      const products = reset ? newList : [...this.data.products, ...newList];
      this.setData({
        products,
        page,
        total: res.total,
        noMore: products.length >= res.total,
      });
    } catch (e) {}

    this.setData({ loading: false });
  },

  onCategoryTap(e) {
    const id = e.currentTarget.dataset.id;
    if (id === this.data.activeCategoryId) return;
    const cat = this.data.categories.find(c => c.id === id) || {};
    this.setData({ activeCategoryId: id, activeCategoryName: cat.name || '', noMore: false });
    this.loadProducts(true);
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  onSearchConfirm() {
    this.setData({ noMore: false });
    this.loadProducts(true);
  },

  onReachBottom() {
    this.loadProducts(false);
  },

  onProductTap(e) {
    wx.navigateTo({ url: `/pages/product-detail/product-detail?id=${e.currentTarget.dataset.id}` });
  },

  onAddBtnTap(e) {
    if (!isLoggedIn()) {
      return wx.navigateTo({ url: '/pages/login/login' });
    }
    const id = e.currentTarget.dataset.id;
    const product = this.data.products.find(p => p.id === id) || {};
    this.setData({ showPopup: true, popupProduct: product });
  },

  onClosePopup() {
    this.setData({ showPopup: false });
  },

  async onPopupConfirm(e) {
    const { quantity } = e.detail;
    const { popupProduct } = this.data;
    this.setData({ showPopup: false });
    try {
      await http.post('/api/h5/cart', { product_id: popupProduct.id, quantity });
      wx.showToast({ title: '已加入购物车', icon: 'success' });
    } catch (e) {}
  },
});
