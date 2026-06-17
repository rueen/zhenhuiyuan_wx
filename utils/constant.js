/* 环境切换：'development' | 'production' */
const ENV = 'development';

const BASE_URL_MAP = {
  development: 'http://localhost:3000',
  production:  'https://api.zhenhuiyuan.cn',
};

const BASE_URL = BASE_URL_MAP[ENV];

/* 订单状态 */
const ORDER_STATUS = {
  0: '待付款',
  1: '待发货',
  2: '待收货',
  4: '已取消',
  5: '已退款',
};

/* 提现状态 */
const WITHDRAWAL_STATUS = {
  0: '待审核',
  1: '待打款',
  2: '已打款',
  3: '已驳回',
};

/* 提现账户类型 */
const ACCOUNT_TYPE = {
  1: '银行卡',
  2: '支付宝',
  3: '微信',
};

module.exports = {
  BASE_URL,
  ORDER_STATUS,
  WITHDRAWAL_STATUS,
  ACCOUNT_TYPE,
};
