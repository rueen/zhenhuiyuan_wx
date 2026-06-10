/**
 * pages/webview/webview.js
 * 外链 Web-view 页
 * 参数：url（完整 URL，需 encodeURIComponent 编码传入）
 */

Page({
  data: {
    /** 解码后的外链地址 */
    src: '',
  },

  /**
   * 生命周期函数--监听页面加载
   * @param {object} options - 页面参数
   * @param {string} options.url - encodeURIComponent 编码后的目标 URL
   */
  onLoad(options) {
    const src = decodeURIComponent(options.url || '');
    const title = options.title ? decodeURIComponent(options.title) : '';
    if (title) wx.setNavigationBarTitle({ title });
    this.setData({ src });
  },
});
