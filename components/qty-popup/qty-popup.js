Component({
  properties: {
    show:         { type: Boolean, value: false },
    product:      { type: Object,  value: {} },
    action:       { type: String,  value: 'cart' },
    offsetBottom: { type: String,  value: '0px' },
  },

  data: { quantity: 1 },

  observers: {
    show(val) {
      if (val) this.setData({ quantity: 1 });
    },
  },

  methods: {
    onMinus() {
      if (this.data.quantity <= 1) return;
      this.setData({ quantity: this.data.quantity - 1 });
    },

    onPlus() {
      const { quantity, product } = this.data;
      if (product.stock && quantity >= product.stock) {
        return wx.showToast({ title: '库存不足', icon: 'none' });
      }
      this.setData({ quantity: quantity + 1 });
    },

    onClose() {
      this.triggerEvent('close');
    },

    onConfirm() {
      this.triggerEvent('confirm', {
        quantity: this.data.quantity,
        action: this.data.action,
      });
    },
  },
});
