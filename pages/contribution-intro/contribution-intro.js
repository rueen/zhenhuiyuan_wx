const http = require('../../utils/request');
const { isLoggedIn } = require('../../utils/auth');

Page({
  data: {
    rules: null,
    profile: null,
    isLoggedIn: false,
  },

  onLoad() {
    this.setData({ isLoggedIn: isLoggedIn() });
    this.loadRules();
    if (isLoggedIn()) this.loadProfile();
  },

  async loadRules() {
    try {
      const rules = await http.get('/api/h5/rules');
      const c = rules.contribution || {};
      this.setData({
        rules: {
          contribution_coefficient: c.coefficient ?? 1,
          contribution_self_rate_pct: Math.round((c.self_rate ?? 0) * 100),
          contribution_direct_rate_pct: Math.round((c.direct_rate ?? 0) * 100),
          contribution_indirect_rate_pct: Math.round((c.indirect_rate ?? 0) * 100),
        },
      });
    } catch (e) {}
  },

  async loadProfile() {
    try {
      const profile = await http.get('/api/h5/auth/profile');
      const next = profile.next_level || null;
      this.setData({
        profile: {
          ...profile,
          next_level: next,
          gap_to_next_level: next ? next.upgrade_threshold - profile.cumulative_contribution : 0,
        },
      });
    } catch (e) {}
  },

  onViewLogs() {
    wx.navigateTo({ url: '/pages/contribution-logs/contribution-logs' });
  },
});
