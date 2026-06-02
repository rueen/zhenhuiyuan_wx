Component({
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/home/home', text: '首页', iconPath: '/images/svg/home.svg',  selectedIconPath: '/images/svg/home_active.svg' },
      { pagePath: '/pages/shop/shop', text: '商店', iconPath: '/images/svg/shop.svg',  selectedIconPath: '/images/svg/shop_active.svg' },
      { pagePath: '/pages/mine/mine', text: '我的', iconPath: '/images/svg/mine.svg',  selectedIconPath: '/images/svg/mine_active.svg' },
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
