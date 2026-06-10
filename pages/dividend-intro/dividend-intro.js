const http = require('../../utils/request');
const { isLoggedIn } = require('../../utils/auth');

Page({
  data: {
    rules: null,
    levels: [],
    isLoggedIn: false,
  },

  onLoad() {
    this.setData({ isLoggedIn: isLoggedIn() });
    this.loadData();
  },

  async loadData() {
    try {
      const [rules, levels] = await Promise.all([
        http.get('/api/h5/rules'),
        http.get('/api/h5/levels'),
      ]);
      const d = rules.dividend || {};
      const charityRate = d.charity_rate ?? 0;
      const extractRate = d.pool_extract_rate ?? 0;
      this.setData({
        rules: {
          dividend_pool_extract_rate_pct: Math.round(extractRate * 100),
          dividend_charity_rate_pct: Math.round(charityRate * 100),
          dividend_member_rate_pct: Math.round((1 - charityRate) * 100),
        },
        levels: (levels || []).map(l => ({
          ...l,
          dividend_pool_rate_pct: Math.round((l.dividend_pool_rate ?? 0) * 100),
        })),
      });
    } catch (e) {}
  },

  onViewDividends() {
    wx.navigateTo({ url: '/pages/dividend/dividend' });
  },
});
