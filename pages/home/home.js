/**
 * pages/home/home.js
 * 首页：顶部 Banner、中医学堂、新品发售三个广告区块
 */

const http = require('../../utils/request');
const { navigateByAd } = require('../../utils/nav');

Page({
  data: {
    /** 顶部 Banner 广告列表 */
    bannerAds: [],
    /** 中医学堂广告列表（最多取前 3 条） */
    schoolAds: [],
    /** 新品发售广告列表 */
    newProductAds: [],
    /** 当前 Banner 下标（用于圆点指示器） */
    bannerCurrent: 0,
    /** Banner swiper 高度（px），根据图片原始尺寸动态计算 */
    bannerSwiperHeight: 400,
  },

  /** 屏幕宽度（px），用于计算图片等比高度 */
  _screenWidth: 375,

  onLoad() {
    const { screenWidth } = wx.getSystemInfoSync();
    this._screenWidth = screenWidth || 375;
    this.loadAds();
  },

  onShow() {
    if (typeof this.getTabBar === 'function') {
      this.getTabBar().setData({ selected: 0 });
    }
  },

  /**
   * 并行请求三个广告位数据
   */
  async loadAds() {
    const positions = ['home_top_banner', 'home_school', 'home_new_product'];
    const [bannerAds, schoolAds, newProductAds] = await Promise.allSettled(
      positions.map(pos => http.get('/api/h5/ads', { position: pos }))
    ).then(results =>
      results.map(r => (r.status === 'fulfilled' ? r.value || [] : []))
    );

    this.setData({
      bannerAds,
      schoolAds: schoolAds.slice(0, 3),
      newProductAds,
    });

    if (bannerAds.length > 0) {
      this._calcBannerHeight(bannerAds);
    }
  },

  /**
   * 根据所有 Banner 图片的原始尺寸，取最大等比高度设置 swiper
   * @param {Array} ads - Banner 广告列表
   */
  _calcBannerHeight(ads) {
    const screenWidth = this._screenWidth;
    const tasks = ads.map(
      ad =>
        new Promise(resolve => {
          wx.getImageInfo({
            src: ad.image,
            success: ({ width, height }) => {
              resolve(width > 0 ? Math.round((height / width) * screenWidth) : 0);
            },
            fail: () => resolve(0),
          });
        })
    );

    Promise.all(tasks).then(heights => {
      const maxH = Math.max(...heights.filter(h => h > 0));
      if (maxH > 0) {
        this.setData({ bannerSwiperHeight: maxH });
      }
    });
  },

  /**
   * Banner 轮播切换
   * @param {object} e - swiper change 事件
   */
  onBannerChange(e) {
    this.setData({ bannerCurrent: e.detail.current });
  },

  /**
   * 点击 Banner 广告
   * @param {object} e - 事件对象，dataset.index 为广告下标
   */
  onBannerTap(e) {
    const ad = this.data.bannerAds[e.currentTarget.dataset.index];
    navigateByAd(ad);
  },

  /**
   * 点击中医学堂广告
   * @param {object} e - 事件对象，dataset.index 为广告下标
   */
  onSchoolTap(e) {
    const ad = this.data.schoolAds[e.currentTarget.dataset.index];
    navigateByAd(ad);
  },

  /**
   * 点击新品发售广告
   * @param {object} e - 事件对象，dataset.index 为广告下标
   */
  onNewProductTap(e) {
    const ad = this.data.newProductAds[e.currentTarget.dataset.index];
    navigateByAd(ad);
  },
});
