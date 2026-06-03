/**
 * pages/article-detail/article-detail.js
 * 文章详情页
 * 参数：id（文章 ID）
 */

const http = require('../../utils/request');

Page({
  data: {
    /** 文章标题 */
    title: '',
    /** 文章正文富文本 HTML */
    content: '',
    /** 更新时间 */
    updatedAt: '',
    loading: true,
    loadError: false,
  },

  /** 文章 ID */
  _id: '',

  /**
   * 生命周期函数--监听页面加载
   * @param {object} options - 页面参数
   * @param {string} options.id - 文章 ID
   */
  onLoad(options) {
    this._id = decodeURIComponent(options.id || '');
    if (this._id) {
      this.loadArticle();
    }
  },

  /**
   * 加载文章详情
   */
  async loadArticle() {
    this.setData({ loading: true, loadError: false });
    try {
      const article = await http.get(`/api/h5/articles/${this._id}`);
      wx.setNavigationBarTitle({ title: article.title || '文章详情' });
      this.setData({
        title: article.title || '',
        content: article.content || '',
        updatedAt: article.updated_at || '',
      });
    } catch (e) {
      this.setData({ loadError: true });
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 重试加载
   */
  onRetry() {
    this.loadArticle();
  },
});
