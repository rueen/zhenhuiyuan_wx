Component({
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/home/home',  text: '首页',  icon: 'home' },
      { pagePath: '/pages/shop/shop',  text: '商店',  icon: 'shop' },
      { pagePath: '/pages/mine/mine',  text: '我的',  icon: 'mine' },
    ],
  },

  methods: {
    switchTab(e) {
      const { index, path } = e.currentTarget.dataset;
      if (this.data.selected === index) return;
      wx.switchTab({ url: path });
    },
  },
});
