const http = require('../../utils/request');
const { WITHDRAWAL_STATUS, ACCOUNT_TYPE } = require('../../utils/constant');

Page({
  data: {
    info: null,
    accounts: [],
    records: [],
    page: 1,
    pageSize: 10,
    total: 0,
    noMore: false,
    loading: false,
    // 申请提现
    showApplyPanel: false,
    selectedAccountId: null,
    applyAmount: '',
    submitting: false,
    ACCOUNT_TYPE,
  },

  onShow() {
    this.loadInfo();
    this.loadAccounts();
    this.loadRecords(true);
  },

  async loadInfo() {
    try {
      const info = await http.get('/api/h5/withdrawals/info');
      this.setData({ info });
    } catch (e) {}
  },

  async loadAccounts() {
    try {
      const list = await http.get('/api/h5/withdrawal-accounts');
      const accounts = (list || []).map(a => ({
        ...a,
        typeName: ACCOUNT_TYPE[a.account_type] || '',
      }));
      this.setData({ accounts });
    } catch (e) {}
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

  onApply() {
    this.setData({ showApplyPanel: true });
  },

  onClosePanel() {
    this.setData({ showApplyPanel: false, applyAmount: '', selectedAccountId: null });
  },

  onSelectAccount(e) {
    this.setData({ selectedAccountId: e.currentTarget.dataset.id });
  },

  onAmountInput(e) {
    this.setData({ applyAmount: e.detail.value });
  },

  onFillMax() {
    const { info } = this.data;
    if (!info) return;
    this.setData({ applyAmount: info.available_amount });
  },

  async onSubmitApply() {
    const { selectedAccountId, applyAmount, info, submitting } = this.data;
    if (submitting) return;

    if (!selectedAccountId) return wx.showToast({ title: '请选择提现账户', icon: 'none' });
    const amount = parseFloat(applyAmount);
    if (!amount || amount < parseFloat(info?.min_amount || 0)) {
      return wx.showToast({ title: `最低提现 ¥${info?.min_amount}`, icon: 'none' });
    }
    if (amount > parseFloat(info?.available_amount || 0)) {
      return wx.showToast({ title: '超出可用余额', icon: 'none' });
    }

    this.setData({ submitting: true });
    try {
      await http.post('/api/h5/withdrawals', { account_id: selectedAccountId, amount: applyAmount });
      wx.showToast({ title: '申请成功', icon: 'success' });
      this.onClosePanel();
      this.loadInfo();
      this.loadRecords(true);
    } finally {
      this.setData({ submitting: false });
    }
  },
});
