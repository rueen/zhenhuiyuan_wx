/**
 * pages/agreement/agreement.js
 * 用户协议和隐私政策页面
 */
Page({
  data: {
    /** 当前激活的标签：'user' | 'privacy' */
    activeTab: 'user',
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
   * 分享功能
   * @returns {object} 分享配置
   */
  onShareAppMessage() {
    return {
      title: '用户协议与隐私条款',
      path: '/pages/agreement/agreement',
    };
  },
});
