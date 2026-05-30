Page({
  onShow() {
    if (typeof this.getTabBar === 'function') {
      this.getTabBar().setData({ selected: 0 });
    }
  },
});
