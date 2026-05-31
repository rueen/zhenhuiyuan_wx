const http = require('../../utils/request');
const { WITHDRAWAL_STATUS } = require('../../utils/constant');

Page({
  data: {
    records: [],
    page: 1,
    pageSize: 20,
    total: 0,
    noMore: false,
    loading: false,
  },

  onShow() {
    this.loadRecords(true);
  },

  async loadRecords(reset = false) {
    if (this.data.loading) return;
    if (!reset && this.data.noMore) return;

    const page = reset ? 1 : this.data.page + 1;
    this.setData({ loading: true });

    try {
      const res = await http.get('/api/h5/withdrawals', { page, pageSize: this.data.pageSize });
      const list = (res.list || []).map(r => ({
        ...r,
        statusText: WITHDRAWAL_STATUS[r.status] || '',
      }));
      const records = reset ? list : [...this.data.records, ...list];
      this.setData({ records, page, total: res.total, noMore: records.length >= res.total });
    } catch (e) {}

    this.setData({ loading: false });
  },

  onReachBottom() {
    this.loadRecords(false);
  },
});
