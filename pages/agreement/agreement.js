/**
 * pages/agreement/agreement.js
 * 用户协议和隐私政策页面
 */

const http = require('../../utils/request');

/** 文章 location 常量 */
const LOCATION_USER_AGREEMENT = 'user-agreement';
const LOCATION_PRIVACY_POLICY = 'privacy-policy';

Page({
  /**
   * 页面的初始数据
   */
  data: {
    /** 当前激活的标签：'user' | 'privacy' */
    activeTab: 'user',
    /** 用户协议内容（富文本 HTML） */
    userContent: '',
    /** 隐私条款内容（富文本 HTML） */
    privacyContent: '',
    /** 用户协议加载状态 */
    userLoading: false,
    /** 隐私条款加载状态 */
    privacyLoading: false,
    /** 用户协议加载失败 */
    userError: false,
    /** 隐私条款加载失败 */
    privacyError: false,
  },

  /**
   * 生命周期函数--监听页面加载
   * @param {object} options - 页面参数，支持 tab（'user' | 'privacy'）
   */
  onLoad(options) {
    const { tab } = options;
    if (tab === 'user' || tab === 'privacy') {
      this.setData({ activeTab: tab });
    }
    // 并行加载两篇文章
    this.fetchUserAgreement();
    this.fetchPrivacyPolicy();
  },

  /**
   * 获取用户协议内容
   */
  async fetchUserAgreement() {
    this.setData({ userLoading: true, userError: false });
    try {
      const article = await http.get(`/api/h5/articles/location/${LOCATION_USER_AGREEMENT}`);
      this.setData({ userContent: article.content || '' });
    } catch (e) {
      this.setData({ userError: true });
    } finally {
      this.setData({ userLoading: false });
    }
  },

  /**
   * 获取隐私条款内容
   */
  async fetchPrivacyPolicy() {
    this.setData({ privacyLoading: true, privacyError: false });
    try {
      const article = await http.get(`/api/h5/articles/location/${LOCATION_PRIVACY_POLICY}`);
      this.setData({ privacyContent: article.content || '' });
    } catch (e) {
      this.setData({ privacyError: true });
    } finally {
      this.setData({ privacyLoading: false });
    }
  },

  /**
   * 切换标签
   * @param {object} e - 事件对象
   */
  onTabSwitch(e) {
    const { tab } = e.currentTarget.dataset;
    this.setData({ activeTab: tab });
  },

  /**
   * 重试加载用户协议
   */
  onRetryUser() {
    this.fetchUserAgreement();
  },

  /**
   * 重试加载隐私条款
   */
  onRetryPrivacy() {
    this.fetchPrivacyPolicy();
  },

  /**
   * 分享功能
   * @returns {object} 分享配置
   */
  onShareAppMessage() {
    return {
      title: '用户协议与隐私条款',
      path: '/pages/agreement/agreement'
    };
  }
});
