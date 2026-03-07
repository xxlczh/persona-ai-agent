/**
 * 响应缓存中间件
 * 对 GET 请求进行缓存
 */

const cacheService = require('../services/CacheService');

/**
 * 创建缓存中间件
 * @param {Object} options 配置选项
 * @param {number} options.ttl 缓存时间（秒）
 * @param {Function} options.keyGenerator 生成缓存键的函数
 */
const createCacheMiddleware = (options = {}) => {
  const { ttl = 300, keyGenerator } = options;

  return async (req, res, next) => {
    // 只缓存 GET 请求
    if (req.method !== 'GET') {
      return next();
    }

    // 生成缓存键
    const cacheKey = keyGenerator
      ? keyGenerator(req)
      : `api:${req.originalUrl || req.url}`;

    try {
      const cachedData = await cacheService.get(cacheKey);

      if (cachedData) {
        return res.json({
          success: true,
          message: '获取成功(缓存)',
          data: cachedData,
          cached: true
        });
      }

      // 保存原始 json 方法
      const originalJson = res.json.bind(res);

      // 拦截响应，在发送后缓存
      res.json = (data) => {
        // 异步缓存，不阻塞响应
        if (data && data.success !== false) {
          cacheService.set(cacheKey, data, ttl).catch(err => {
            console.error('缓存响应失败:', err.message);
          });
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('缓存中间件错误:', error.message);
      next();
    }
  };
};

module.exports = createCacheMiddleware;
