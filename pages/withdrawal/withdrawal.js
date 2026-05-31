const http = require('../../utils/request');
const { ACCOUNT_TYPE } = require('../../utils/constant');

Page({
  data: {
    info: null,
    accounts: [],
    showApplyPanel: false,
    selectedAccountId: null,
    applyAmount: '',
    submitting: false,
    ACCOUNT_TYPE,
  },

  onShow() {
    this.loadInfo();
    this.loadAccounts();
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

  onRecordsTap() {
    wx.navigateTo({ url: '/pages/withdrawal-records/withdrawal-records' });
  },

  onBalanceLogsTap() {
    wx.navigateTo({ url: '/pages/balance-logs/balance-logs' });
  },

  onAccountsTap() {
    wx.navigateTo({ url: '/pages/withdrawal-accounts/withdrawal-accounts' });
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
    } finally {
      this.setData({ submitting: false });
    }
  },
});
