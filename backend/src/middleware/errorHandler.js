/**
 * 全局错误处理中间件
 * 统一处理应用程序中的所有错误
 */

const AppError = require('../utils/AppError');
const { logger } = require('../utils/logger');

/**
 * 错误处理中间件
 * @param {Error} err - 错误对象
 * @param {Object} req - Express request 对象
 * @param {Object} res - Express response 对象
 * @param {Function} next - Express next 函数
 */
const errorHandler = (err, req, res, _next) => {
  let error = err;

  // 如果不是 AppError，转换为 AppError
  if (!(err instanceof AppError)) {
    error = AppError.fromError(err);
  }

  // 记录错误日志
  logError(req, error);

  // 发送错误响应
  sendErrorResponse(res, error);
};

/**
 * 记录错误日志
 */
const logError = (req, error) => {
  const logData = {
    code: error.code,
    message: error.message,
    statusCode: error.statusCode,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id || 'anonymous'
  };

  if (error.details) {
    logData.details = error.details;
  }

  if (error.stack && process.env.NODE_ENV === 'development') {
    logData.stack = error.stack;
  }

  // 根据状态码判断日志级别
  if (error.statusCode >= 500) {
    logger.error(`[${error.code}] ${error.message}`, logData);
  } else if (error.statusCode >= 400) {
    logger.warn(`[${error.code}] ${error.message}`, logData);
  } else {
    logger.info(`[${error.code}] ${error.message}`, logData);
  }
};

/**
 * 发送错误响应
 */
const sendErrorResponse = (res, error) => {
  const response = error.toJSON();

  // 在开发环境添加堆栈信息
  if (process.env.NODE_ENV === 'development' && error.stack) {
    response.stack = error.stack;
  }

  res.status(error.statusCode).json(response);
};

/**
 * 异步错误处理包装器
 * 用于包装异步路由处理函数，自动捕获错误
 * @param {Function} fn - 异步函数
 * @returns {Function} 包装后的函数
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 路由处理中间件
 * 处理不存在的路由
 */
const notFoundHandler = (req, res, next) => {
  const error = AppError.notFound(`Route ${req.method} ${req.originalUrl}`);
  next(error);
};

module.exports = {
  errorHandler,
  asyncHandler,
  notFoundHandler
};
