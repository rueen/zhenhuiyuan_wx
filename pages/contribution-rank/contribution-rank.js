const http = require('../../utils/request');

Page({
  data: {
    myInfo: null,
    list: [],
    loading: false,
  },

  onShow() {
    this.loadRank();
  },

  /**
   * 加载贡献值排行榜（前 20 名）
   */
  async loadRank() {
    if (this.data.loading) return;
    this.setData({ loading: true });
    try {
      const res = await http.get('/api/h5/member/rank/contribution');
      const myInfo = res?.myInfo || null;
      const list = (res?.list || []).map(item => ({
        ...item,
        isMe: myInfo && item.rank === myInfo.rank,
      }));
      this.setData({ myInfo, list });
    } catch (e) {}
    this.setData({ loading: false });
  },
});
