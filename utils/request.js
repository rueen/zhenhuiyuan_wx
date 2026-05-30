const { BASE_URL } = require('./constant');
const { getToken, clearToken } = require('./auth');

/**
 * 统一请求封装
 * @param {object} options - { url, method, data, showLoading }
 * @returns {Promise}
 */
function request(options) {
  const { url, method = 'GET', data, showLoading = false } = options;

  if (showLoading) wx.showLoading({ title: '加载中', mask: true });

  const token = getToken();
  const header = { 'Content-Type': 'application/json' };
  if (token) header['Authorization'] = `Bearer ${token}`;

  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + url,
      method,
      data,
      header,
      success(res) {
        if (showLoading) wx.hideLoading();
        const { code, message: msg, data: resData } = res.data;

        if (code === 0) {
          resolve(resData);
          return;
        }

        if (code === 1002) {
          clearToken();
          wx.showToast({ title: '登录已过期', icon: 'none' });
          setTimeout(() => wx.reLaunch({ url: '/pages/login/login' }), 1000);
          reject(new Error(msg));
          return;
        }

        wx.showToast({ title: msg || '请求失败', icon: 'none', duration: 2000 });
        reject(new Error(msg));
      },
      fail(err) {
        if (showLoading) wx.hideLoading();
        wx.showToast({ title: '网络连接失败', icon: 'none' });
        reject(err);
      },
    });
  });
}

const http = {
  get:    (url, data)  => request({ url, method: 'GET',    data }),
  post:   (url, data)  => request({ url, method: 'POST',   data }),
  put:    (url, data)  => request({ url, method: 'PUT',    data }),
  delete: (url, data)  => request({ url, method: 'DELETE', data }),
  load:   (url, data)  => request({ url, method: 'GET',    data, showLoading: true }),
};

module.exports = http;
