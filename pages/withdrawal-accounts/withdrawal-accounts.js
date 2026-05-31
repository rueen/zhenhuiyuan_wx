const http = require('../../utils/request');
const { ACCOUNT_TYPE } = require('../../utils/constant');

const DEFAULT_FORM = () => ({
  account_type: 1,
  real_name: '',
  account_no: '',
  bank_name: '',
  is_default: false,
});

Page({
  data: {
    accounts: [],
    loading: false,
    showAddPanel: false,
    editingId: null,
    form: DEFAULT_FORM(),
    submitting: false,
  },

  onShow() {
    this.loadAccounts();
  },

  async loadAccounts() {
    this.setData({ loading: true });
    try {
      const list = await http.get('/api/h5/withdrawal-accounts');
      const accounts = (list || []).map(a => ({
        ...a,
        typeName: ACCOUNT_TYPE[a.account_type] || '',
      }));
      this.setData({ accounts });
    } catch (e) {}
    this.setData({ loading: false });
  },

  onAdd() {
    this.setData({ showAddPanel: true, editingId: null, form: DEFAULT_FORM() });
  },

  async onEdit(e) {
    const id = e.currentTarget.dataset.id;
    try {
      const detail = await http.get(`/api/h5/withdrawal-accounts/${id}`);
      this.setData({
        showAddPanel: true,
        editingId: id,
        form: {
          account_type: detail.account_type,
          real_name: detail.real_name || '',
          account_no: detail.account_no || '',
          bank_name: detail.bank_name || '',
          is_default: false,
        },
      });
    } catch (e) {}
  },

  onClosePanel() {
    this.setData({ showAddPanel: false, editingId: null });
  },

  onTypeChange(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ 'form.account_type': type, 'form.bank_name': '' });
  },

  onFormInput(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ [`form.${key}`]: e.detail.value });
  },

  onDefaultChange(e) {
    this.setData({ 'form.is_default': e.detail.value });
  },

  async onSubmitForm() {
    const { form, editingId, submitting } = this.data;
    if (submitting) return;

    if (!form.real_name.trim()) return wx.showToast({ title: '请输入真实姓名', icon: 'none' });
    if (!editingId && !form.account_no.trim()) return wx.showToast({ title: '请输入账号', icon: 'none' });
    if (form.account_type === 1 && !form.bank_name.trim()) {
      return wx.showToast({ title: '请输入开户银行', icon: 'none' });
    }

    this.setData({ submitting: true });
    try {
      if (editingId) {
        const body = {
          account_type: form.account_type,
          real_name: form.real_name.trim(),
          bank_name: form.account_type === 1 ? form.bank_name.trim() : undefined,
        };
        if (form.account_no.trim()) body.account_no = form.account_no.trim();
        await http.put(`/api/h5/withdrawal-accounts/${editingId}`, body);
        wx.showToast({ title: '保存成功', icon: 'success' });
      } else {
        const body = {
          account_type: form.account_type,
          real_name: form.real_name.trim(),
          account_no: form.account_no.trim(),
          is_default: form.is_default,
        };
        if (form.account_type === 1) body.bank_name = form.bank_name.trim();
        await http.post('/api/h5/withdrawal-accounts', body);
        wx.showToast({ title: '添加成功', icon: 'success' });
      }
      this.onClosePanel();
      this.loadAccounts();
    } catch (e) {}
    this.setData({ submitting: false });
  },

  async onSetDefault(e) {
    const id = e.currentTarget.dataset.id;
    try {
      await http.put(`/api/h5/withdrawal-accounts/${id}/default`);
      this.loadAccounts();
    } catch (e) {}
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该提现账户吗？',
      confirmColor: '#e53935',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await http.delete(`/api/h5/withdrawal-accounts/${id}`);
          wx.showToast({ title: '已删除', icon: 'success' });
          this.loadAccounts();
        } catch (e) {}
      },
    });
  },
});
