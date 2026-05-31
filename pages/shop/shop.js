const http = require('../../utils/request');

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
    contentHeight: 0,
    searchBarHeight: 0,
  },

  onLoad() {
    const sys = wx.getSystemInfoSync();
    // 内容区高度 = 窗口高度 - 导航栏 - 搜索栏 - 自定义tabBar
    const navBarHeight = sys.statusBarHeight + 44;
    const tabBarHeight = 56 + sys.safeArea.bottom - sys.screenHeight + sys.windowHeight;
    const searchBarHeight = 96; // rpx to px: 96rpx ≈ 48px
    const contentHeight = sys.windowHeight - navBarHeight - 48 - 56;
    this.setData({ contentHeight });
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
});
