const http = require('../../utils/request');

Page({
  data: {
    isEdit: false,
    addressId: null,
    form: {
      receiver_name: '',
      phone: '',
      province_code: '',
      province_name: '',
      city_code: '',
      city_name: '',
      district_code: '',
      district_name: '',
      detail: '',
      is_default: false,
    },
    regionDisplay: '',
    submitting: false,
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ isEdit: true, addressId: options.id });
      wx.setNavigationBarTitle({ title: '编辑地址' });
      this.loadAddress(options.id);
    }
  },

  async loadAddress(id) {
    try {
      const addr = await http.load(`/api/h5/addresses/${id}`);
      const regionDisplay = [addr.province_name, addr.city_name, addr.district_name].filter(Boolean).join(' ');
      this.setData({ form: addr, regionDisplay });
    } catch (e) {}
  },

  onFieldInput(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ [`form.${key}`]: e.detail.value });
  },

  onRegionChange(e) {
    const [p, c, d] = e.detail.value;
    this.setData({
      'form.province_name': p,
      'form.city_name': c,
      'form.district_name': d,
      regionDisplay: `${p} ${c} ${d}`,
    });
  },

  onDefaultChange(e) {
    this.setData({ 'form.is_default': e.detail.value });
  },

  async onSubmit() {
    const { form, isEdit, addressId, submitting } = this.data;
    if (submitting) return;

    if (!form.receiver_name.trim()) return wx.showToast({ title: '请填写收货人', icon: 'none' });
    if (!/^1[3-9]\d{9}$/.test(form.phone)) return wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
    if (!form.province_name) return wx.showToast({ title: '请选择所在地区', icon: 'none' });
    if (!form.detail.trim()) return wx.showToast({ title: '请填写详细地址', icon: 'none' });

    this.setData({ submitting: true });
    try {
      if (isEdit) {
        await http.put(`/api/h5/addresses/${addressId}`, form);
      } else {
        await http.post('/api/h5/addresses', form);
      }
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1000);
    } finally {
      this.setData({ submitting: false });
    }
  },
});
