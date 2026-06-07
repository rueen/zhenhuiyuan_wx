const http = require('./request');
const { getToken } = require('./auth');

/**
 * OSS 签名内存缓存，按 dir 分别缓存（不同目录的签名相互独立）
 * @type {Record<string, { host: string, dir: string, accessKeyId: string, policy: string, signature: string, expire: number, maxSize: number }>}
 */
const _signatureCache = {};

/**
 * 获取 OSS 直传签名（带内存缓存，过期前 60s 自动刷新）
 * @param {string} dir - 上传目录，如 'avatar'、'product'、'voucher'
 * @returns {Promise<{ host: string, dir: string, accessKeyId: string, policy: string, signature: string, expire: number, maxSize: number }>}
 */
async function _getSignature(dir) {
  const now = Math.floor(Date.now() / 1000);
  const cached = _signatureCache[dir];
  if (cached && cached.expire - now > 60) {
    return cached;
  }
  const sig = await http.get('/api/h5/oss/signature', { dir });
  _signatureCache[dir] = sig;
  return sig;
}

/**
 * 压缩图片（质量 80，平衡画质与文件体积）
 * @param {string} filePath - 本地临时文件路径
 * @returns {Promise<string>} 压缩后的临时文件路径
 */
function _compressImage(filePath) {
  return new Promise((resolve, reject) => {
    wx.compressImage({
      src: filePath,
      quality: 80,
      success: (res) => resolve(res.tempFilePath),
      fail: () => resolve(filePath), // 压缩失败时降级使用原图
    });
  });
}

/**
 * 获取文件大小（字节）
 * @param {string} filePath
 * @returns {Promise<number>}
 */
function _getFileSize(filePath) {
  return new Promise((resolve) => {
    wx.getFileInfo({
      filePath,
      success: (res) => resolve(res.size),
      fail: () => resolve(0),
    });
  });
}

/**
 * 上传图片到阿里云 OSS（直传）
 *
 * 流程：获取签名 → 压缩图片 → 校验大小 → wx.uploadFile 直传 OSS → 返回访问 URL
 *
 * @param {string} filePath - 本地临时文件路径（wx.chooseMedia 等接口返回的 tempFilePath）
 * @param {'avatar' | 'product' | 'voucher' | 'common'} [module='common'] - 模块目录名，决定 OSS 存储路径
 * @returns {Promise<string>} 上传成功后的图片访问 URL
 */
async function uploadImage(filePath, module = 'common') {
  // 1. 获取签名（传入 module 作为 dir，后端据此限定上传路径）
  const sig = await _getSignature(module);
  const { host, dir, accessKeyId, policy, signature, maxSize } = sig;

  // 2. 压缩图片
  const compressedPath = await _compressImage(filePath);

  // 3. 校验文件大小
  if (maxSize) {
    const size = await _getFileSize(compressedPath);
    if (size > maxSize) {
      wx.showToast({ title: '图片太大，请选择较小的图片', icon: 'none' });
      throw new Error(`文件大小 ${size} 超出限制 ${maxSize}`);
    }
  }

  // 4. 生成唯一文件名（dir 已由后端根据入参设定，直接拼接文件名）
  const random = Math.random().toString(36).slice(2, 8);
  const key = `${dir}${Date.now()}_${random}.jpg`;

  // 5. 直传 OSS
  return new Promise((resolve, reject) => {
    const token = getToken();
    wx.uploadFile({
      url: host,
      filePath: compressedPath,
      name: 'file',
      header: token ? { Authorization: `Bearer ${token}` } : {},
      formData: {
        key,
        OSSAccessKeyId: accessKeyId,
        policy,
        signature,
        'Content-Type': 'image/jpeg',
        // 让 OSS 返回 200，便于 wx.uploadFile 的 success 回调正常触发
        success_action_status: '200',
      },
      success(res) {
        // OSS 直传成功：status 200（配置了 success_action_status）或 204（默认）
        if (res.statusCode === 200 || res.statusCode === 204) {
          resolve(`${host}/${key}`);
        } else {
          wx.showToast({ title: '图片上传失败', icon: 'none' });
          reject(new Error(`OSS 上传失败，statusCode: ${res.statusCode}`));
        }
      },
      fail(err) {
        wx.showToast({ title: '图片上传失败', icon: 'none' });
        reject(err);
      },
    });
  });
}

module.exports = { uploadImage };
