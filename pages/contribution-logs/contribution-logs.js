const http = require('../../utils/request');

Page({
  data: {
    list: [],
    page: 1,
    pageSize: 20,
    total: 0,
    loading: false,
    noMore: false,
  },

  onShow() {
    this.loadList(true);
  },

  async loadList(reset = false) {
    if (this.data.loading) return;
    if (!reset && this.data.noMore) return;

    const page = reset ? 1 : this.data.page + 1;
    this.setData({ loading: true });
    try {
      const res = await http.get('/api/h5/member/contribution-logs', { page, pageSize: this.data.pageSize });
      const list = reset ? (res.list || []) : [...this.data.list, ...(res.list || [])];
      this.setData({ list, page, total: res.total, noMore: list.length >= res.total });
    } catch (e) {}
    this.setData({ loading: false });
  },

  onReachBottom() {
    this.loadList(false);
  },
});
