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
        content: this._processContent(article.content || ''),
        updatedAt: article.updated_at || '',
      });
    } catch (e) {
      this.setData({ loadError: true });
    } finally {
      this.setData({ loading: false });
    }
  },

  /**
   * 对富文本 HTML 做预处理：
   * 给所有 <img> 标签注入 max-width:100%;height:auto 内联样式，防止图片溢出屏幕
   * @param {string} html - 原始 HTML 字符串
   * @returns {string} 处理后的 HTML 字符串
   */
  _processContent(html) {
    if (!html) return '';
    return html.replace(/<img([^>]*?)>/gi, (match, attrs) => {
      // 已有 style 属性：在现有值末尾追加
      if (/style\s*=/i.test(attrs)) {
        return `<img${attrs.replace(
          /style\s*=\s*(['"])(.*?)\1/i,
          (_, q, s) => `style=${q}${s};max-width:100%;height:auto;display:block;${q}`
        )}>`;
      }
      // 没有 style 属性：直接添加
      return `<img${attrs} style="max-width:100%;height:auto;display:block;">`;
    });
  },

  /**
   * 重试加载
   */
  onRetry() {
    this.loadArticle();
  },
});
