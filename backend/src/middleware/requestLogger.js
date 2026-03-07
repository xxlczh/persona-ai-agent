const { logger } = require('../utils/logger');

/**
 * 请求日志中间件
 * 记录每个HTTP请求的详细信息
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // 请求开始时的日志
  logger.info('Incoming Request', {
    method: req.method,
    url: req.originalUrl || req.url,
    path: req.path,
    query: req.query,
    ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    contentType: req.headers['content-type']
  });

  // 响应完成时的日志
  const originalSend = res.send;
  res.send = function (data) {
    res.send = originalSend;
    const duration = Date.now() - startTime;

    logger.http('Request Completed', {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress
    });

    return res.send(data);
  };

  next();
};

module.exports = requestLogger;
