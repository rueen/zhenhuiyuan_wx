const http = require('../../utils/request');
const { isLoggedIn } = require('../../utils/auth');

Page({
  data: {
    levels: [],
    activeIndex: 0,
    currentLevel: null,
    profile: null,
  },

  onLoad() {
    this.loadData();
  },

  async loadData() {
    try {
      const [levels, profile] = await Promise.all([
        http.get('/api/h5/levels'),
        isLoggedIn() ? http.get('/api/h5/auth/profile') : Promise.resolve(null),
      ]);

      const mappedLevels = (levels || []).map(l => ({
        ...l,
        self_rebate_rate_pct: Math.round((l.self_rebate_rate ?? 0) * 100),
        parent_rebate_rate_pct: Math.round((l.parent_rebate_rate ?? 0) * 100),
        grandpa_rebate_rate_pct: Math.round((l.grandpa_rebate_rate ?? 0) * 100),
        dividend_pool_rate_pct: Math.round((l.dividend_pool_rate ?? 0) * 100),
      }));

      let activeIndex = 0;
      let mappedProfile = null;

      if (profile) {
        const idx = mappedLevels.findIndex(l => l.name === profile.level_name);
        if (idx >= 0) activeIndex = idx;

        const next = profile.next_level || null;
        const threshold = next ? next.upgrade_threshold : profile.cumulative_contribution;
        const cum = profile.cumulative_contribution || 0;
        const progressPct = next ? Math.min(100, Math.round((cum / threshold) * 100)) : 100;

        mappedProfile = {
          ...profile,
          next_level: next,
          gap_to_next_level: next ? threshold - cum : 0,
          progress_pct: progressPct,
        };
      }

      this.setData({
        levels: mappedLevels,
        activeIndex,
        currentLevel: mappedLevels[activeIndex] || null,
        profile: mappedProfile,
      });
    } catch (e) {}
  },

  onTabTap(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      activeIndex: index,
      currentLevel: this.data.levels[index] || null,
    });
  },

  onContributionTap() {
    wx.navigateTo({ url: '/pages/contribution-intro/contribution-intro' });
  },
});
