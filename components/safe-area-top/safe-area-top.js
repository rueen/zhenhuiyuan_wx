/**
 * @description 顶部安全距离组件
 * 在 navigationStyle:"custom" 的页面顶部使用，自动撑开状态栏高度，
 * 防止内容被状态栏遮挡。高度数据复用 app.globalData.systemInfo，不重复调用系统接口。
 */
Component({
  properties: {
    /**
     * 额外的补充高度（rpx），叠加在状态栏高度之上
     * @type {Number}
     */
    extraHeight: {
      type: Number,
      value: 0,
    },
  },

  data: {
    /** 状态栏高度（px） */
    height: 0,
  },

  lifetimes: {
    attached() {
      const { statusBarHeight = 0 } = getApp().globalData.systemInfo || {};
      this.setData({ height: statusBarHeight });
    },
  },
});
