const { logger } = require('../utils/logger');

/**
 * 错误日志中间件
 * 捕获并记录所有错误
 */
const errorLogger = (err, req, res, next) => {
  logger.error('Error occurred', {
    method: req.method,
    url: req.originalUrl || req.url,
    path: req.path,
    error: {
      message: err.message,
      name: err.name,
      stack: err.stack
    },
    body: req.body,
    query: req.query,
    params: req.params,
    ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    userAgent: req.headers['user-agent']
  });

  next(err);
};

module.exports = errorLogger;
