const http = require('../../utils/request');

Page({
  data: {
    teamData: null,
    activeDepth: 1,
    loading: false,
    currentList: [],
    listEmpty: true,
  },

  onShow() {
    this.loadTeam();
  },

  async loadTeam() {
    this.setData({ loading: true });
    try {
      const data = await http.get('/api/h5/member/team');
      this.setData({ teamData: data });
      this.updateCurrentList(this.data.activeDepth, data);
    } catch (e) {}
    this.setData({ loading: false });
  },

  updateCurrentList(depth, teamData) {
    const src = teamData || this.data.teamData;
    if (!src) return;
    const list = depth === 1 ? (src.direct || []) : (src.indirect || []);
    this.setData({ currentList: list, listEmpty: list.length === 0 });
  },

  onTabChange(e) {
    const depth = e.currentTarget.dataset.depth;
    this.setData({ activeDepth: depth });
    this.updateCurrentList(depth);
  },
});
