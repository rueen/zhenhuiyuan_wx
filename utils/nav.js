/**
 * utils/nav.js
 * 广告跳转工具函数
 *
 * link_type 约定：
 *   ""               — 无跳转
 *   article_column   — link_value = 栏目 location，跳转文章栏目列表页
 *   article_detail   — link_value = 文章 ID，跳转文章详情页
 *   product_category — link_value = 分类 ID，跳转商品列表页
 *   product_detail   — link_value = 商品 ID，跳转商品详情页
 *   miniapp_page     — link_value = 页面路径（如 /pages/home/home）
 *   external_h5      — link_value = 完整 URL，在 web-view 页中展示
 */

/**
 * 根据广告的 link_type / link_value 执行页面跳转
 * @param {{ link_type: string, link_value: string, title?: string }} ad - 广告对象
 */
function navigateByAd(ad) {
  const { link_type, link_value } = ad || {};
  if (!link_type || !link_value) return;

  switch (link_type) {
    case 'article_column':
      wx.navigateTo({
        url: `/pages/article-column/article-column?location=${encodeURIComponent(link_value)}&title=${encodeURIComponent(ad.title || '')}`,
      });
      break;

    case 'article_detail':
      wx.navigateTo({
        url: `/pages/article-detail/article-detail?id=${encodeURIComponent(link_value)}`,
      });
      break;

    case 'product_category':
      wx.navigateTo({
        url: `/pages/product-list/product-list?categoryId=${encodeURIComponent(link_value)}&title=${encodeURIComponent(ad.title || '')}`,
      });
      break;

    case 'product_detail':
      wx.navigateTo({
        url: `/pages/product-detail/product-detail?id=${encodeURIComponent(link_value)}`,
      });
      break;

    case 'miniapp_page':
      wx.navigateTo({ url: link_value });
      break;

    case 'external_h5':
      wx.navigateTo({
        url: `/pages/webview/webview?url=${encodeURIComponent(link_value)}`,
      });
      break;

    default:
      break;
  }
}

module.exports = { navigateByAd };
