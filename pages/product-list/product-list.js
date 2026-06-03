/**
 * pages/product-list/product-list.js
 * 商品列表页（按分类）
 * 参数：categoryId（分类 ID）、title（可选，导航栏标题）
 */

const http = require('../../utils/request');
const { isLoggedIn } = require('../../utils/auth');

Page({
  data: {
    /** 商品列表 */
    products: [],
    page: 1,
    pageSize: 20,
    total: 0,
    loading: false,
    noMore: false,
    loadError: false,
    /** 加购弹窗 */
    showPopup: false,
    popupProduct: {},
  },

  /** 分类 ID */
  _categoryId: '',

  /**
   * 生命周期函数--监听页面加载
   * @param {object} options - 页面参数
   * @param {string} options.categoryId - 分类 ID
   * @param {string} [options.title] - 导航栏标题
   */
  onLoad(options) {
    const { categoryId, title } = options;
    this._categoryId = decodeURIComponent(categoryId || '');

    if (title) {
      wx.setNavigationBarTitle({ title: decodeURIComponent(title) });
    }

    this.loadProducts(true);
  },

  /**
   * 加载商品列表
   * @param {boolean} reset - 是否重置分页
   */
  async loadProducts(reset = false) {
    if (this.data.loading) return;
    if (!reset && this.data.noMore) return;

    const page = reset ? 1 : this.data.page + 1;
    this.setData({ loading: true, loadError: false });

    try {
      const query = { page, pageSize: this.data.pageSize };
      if (this._categoryId) query.categoryId = this._categoryId;

      const res = await http.get('/api/h5/products', query);
      const newList = res.list || [];
      const products = reset ? newList : [...this.data.products, ...newList];
      this.setData({
        products,
        page,
        total: res.total || 0,
        noMore: products.length >= (res.total || 0),
      });
    } catch (e) {
      if (reset) this.setData({ loadError: true });
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 下拉刷新
   */
  async onPullDownRefresh() {
    await this.loadProducts(true);
    wx.stopPullDownRefresh();
  },

  /**
   * 上拉加载更多
   */
  onReachBottom() {
    this.loadProducts(false);
  },

  /**
   * 点击商品进入详情
   * @param {object} e - 事件对象
   */
  onProductTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/product-detail/product-detail?id=${id}` });
  },

  /**
   * 点击加购按钮
   * @param {object} e - 事件对象
   */
  onAddBtnTap(e) {
    if (!isLoggedIn()) {
      return wx.navigateTo({ url: '/pages/login/login' });
    }
    const { id } = e.currentTarget.dataset;
    const product = this.data.products.find(p => p.id === id) || {};
    this.setData({ showPopup: true, popupProduct: product });
  },

  /**
   * 关闭加购弹窗
   */
  onClosePopup() {
    this.setData({ showPopup: false });
  },

  /**
   * 确认加购
   * @param {object} e - 事件对象，detail.quantity 为数量
   */
  async onPopupConfirm(e) {
    const { quantity } = e.detail;
    const { popupProduct } = this.data;
    this.setData({ showPopup: false });
    try {
      await http.post('/api/h5/cart', { product_id: popupProduct.id, quantity });
      wx.showToast({ title: '已加入购物袋', icon: 'success' });
    } catch (err) {}
  },

  /**
   * 重试加载
   */
  onRetry() {
    this.loadProducts(true);
  },
});
