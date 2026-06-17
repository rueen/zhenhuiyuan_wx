/**
 * 导航返回/首页按钮组件
 *
 * 自动检测页面栈：
 * - 有上级页面 → 显示返回箭头，点击 navigateBack
 * - 无上级页面 → 显示 home 图标，点击 switchTab 到首页
 *
 * 位置自动与系统胶囊按钮垂直对齐，左侧固定 16px。
 */
Component({
  data: {
    /** 按钮距左边距（px） */
    left: 16,
    /** 按钮顶部位置（px） */
    top: 44,
    /** 按钮尺寸（px） */
    size: 32,
    /** 是否有上级页面 */
    hasBack: false,
  },

  lifetimes: {
    attached() {
      const menuBtn = wx.getMenuButtonBoundingClientRect();
      const size = menuBtn.height;
      const top = menuBtn.top + (menuBtn.height - size) / 2;
      const hasBack = getCurrentPages().length > 1;
      this.setData({ top, size, hasBack });
    },
  },

  methods: {
    /** 点击：有上级页面则返回，否则跳转首页 tab */
    onTap() {
      if (this.data.hasBack) {
        wx.navigateBack();
      } else {
        wx.switchTab({ url: '/pages/home/home' });
      }
    },
  },
});
