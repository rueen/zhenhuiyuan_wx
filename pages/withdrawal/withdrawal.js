const http = require('../../utils/request');
const { ACCOUNT_TYPE, WITHDRAWAL_RULES } = require('../../utils/constant');

/**
 * 组装主页面提现规则列表
 * @param {string|number|undefined} minAmount 最低提现金额
 * @returns {Array<{ label: string, value: string }>}
 */
function buildRuleItems(minAmount) {
  const min = minAmount ?? '--';
  return [
    { label: '最低提现金额', value: `¥${min}` },
    { label: '单次最高提现', value: '不超过当前可用余额' },
    { label: '每日提现次数', value: WITHDRAWAL_RULES.dailyLimit },
    { label: '提现时间', value: WITHDRAWAL_RULES.applyTime },
    { label: '到账时间', value: WITHDRAWAL_RULES.arrivalTime },
    { label: '手续费', value: WITHDRAWAL_RULES.fee },
    { label: '提现门槛', value: `可用余额满 ¥${min} 方可申请` },
  ];
}

/**
 * 组装申请弹窗精简规则摘要
 * @param {string|number|undefined} minAmount 最低提现金额
 * @returns {string[]}
 */
function buildPanelRuleItems(minAmount) {
  const min = minAmount ?? '--';
  return [
    `最低提现 ¥${min}，单次最高不超过可用余额`,
    `每日提现次数：${WITHDRAWAL_RULES.dailyLimit}`,
    `到账时间：${WITHDRAWAL_RULES.arrivalTime}`,
    `手续费：${WITHDRAWAL_RULES.fee}`,
  ];
}

Page({
  data: {
    info: null,
    ruleItems: [],
    panelRuleItems: [],
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
      this.setData({
        info,
        ruleItems: buildRuleItems(info?.min_amount),
        panelRuleItems: buildPanelRuleItems(info?.min_amount),
      });
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

  onAddAccountTap() {
    this.onClosePanel();
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
