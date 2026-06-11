const http = require('../../utils/request');
const { ORDER_STATUS } = require('../../utils/constant');

const TABS = [
  { label: '全部',   status: '' },
  { label: '待付款', status: 0  },
  { label: '待发货', status: 1  },
  { label: '待收货', status: 2  },
  { label: '已完成', status: 3  },
  { label: '已取消', status: 4  },
];

Page({
  data: {
    tabs: TABS,
    activeTab: 0,
    orders: [],
    page: 1,
    pageSize: 10,
    total: 0,
    loading: false,
    noMore: false,
  },

  onLoad(options) {
    if (options.status !== undefined && options.status !== '') {
      const idx = TABS.findIndex(t => t.status === parseInt(options.status));
      if (idx > -1) this.setData({ activeTab: idx });
    }
    this.loadOrders(true);
  },

  onShow() {
    this.loadOrders(true);
  },

  async loadOrders(reset = false) {
    if (this.data.loading) return;
    if (!reset && this.data.noMore) return;

    const page = reset ? 1 : this.data.page + 1;
    this.setData({ loading: true });

    try {
      const { tabs, activeTab, pageSize } = this.data;
      const query = { page, pageSize };
      const status = tabs[activeTab].status;
      if (status !== '') query.status = status;

      const res = await http.get('/api/h5/orders', query);
      const list = (res.list || []).map(o => ({
        ...o,
        statusText: ORDER_STATUS[o.status] || '',
      }));
      const orders = reset ? list : [...this.data.orders, ...list];
      this.setData({ orders, page, total: res.total, noMore: orders.length >= res.total });
    } catch (e) {}

    this.setData({ loading: false });
  },

  onTabTap(e) {
    const idx = e.currentTarget.dataset.index;
    if (idx === this.data.activeTab) return;
    this.setData({ activeTab: idx, orders: [], noMore: false });
    this.loadOrders(true);
  },

  onOrderTap(e) {
    wx.navigateTo({ url: `/pages/order-detail/order-detail?id=${e.currentTarget.dataset.id}` });
  },

  onReachBottom() {
    this.loadOrders(false);
  },
});
