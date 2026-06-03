/**
 * pages/article-column/article-column.js
 * 文章栏目列表页
 * 参数：location（栏目 location 标识）、title（可选，导航栏标题）
 */

const http = require('../../utils/request');

Page({
  data: {
    /** 文章列表 */
    articles: [],
    /** 当前页码 */
    page: 1,
    pageSize: 20,
    total: 0,
    loading: false,
    /** 是否已无更多数据 */
    noMore: false,
    /** 初次加载失败 */
    loadError: false,
  },

  /** 栏目 location 标识 */
  _location: '',

  /**
   * 生命周期函数--监听页面加载
   * @param {object} options - 页面参数
   * @param {string} options.location - 栏目 location
   * @param {string} [options.title] - 导航栏标题
   */
  onLoad(options) {
    const { location, title } = options;
    this._location = decodeURIComponent(location || '');

    if (title) {
      wx.setNavigationBarTitle({ title: decodeURIComponent(title) });
    }

    if (this._location) {
      this.loadArticles(true);
    }
  },

  /**
   * 加载文章列表
   * @param {boolean} reset - 是否重置分页（首次加载 / 下拉刷新）
   */
  async loadArticles(reset = false) {
    if (this.data.loading) return;
    if (!reset && this.data.noMore) return;

    const page = reset ? 1 : this.data.page + 1;
    this.setData({ loading: true, loadError: false });

    try {
      const res = await http.get(`/api/h5/articles/column/${this._location}`, {
        page,
        pageSize: this.data.pageSize,
      });
      const newList = res.list || [];
      const articles = reset ? newList : [...this.data.articles, ...newList];
      this.setData({
        articles,
        page,
        total: res.total || 0,
        noMore: articles.length >= (res.total || 0),
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
    await this.loadArticles(true);
    wx.stopPullDownRefresh();
  },

  /**
   * 上拉加载更多
   */
  onReachBottom() {
    this.loadArticles(false);
  },

  /**
   * 点击文章进入详情
   * @param {object} e - 事件对象
   */
  onArticleTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/article-detail/article-detail?id=${id}`,
    });
  },

  /**
   * 重试加载
   */
  onRetry() {
    this.loadArticles(true);
  },
});
