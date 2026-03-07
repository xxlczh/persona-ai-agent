/**
 * 自定义错误类
 * 用于应用程序中的错误处理
 */

const { getErrorInfo } = require('./errorCodes');

class AppError extends Error {
  /**
   * 创建应用错误
   * @param {string} code - 错误码
   * @param {string} message - 错误消息（可选，将被错误码定义覆盖）
   * @param {Object} details - 额外的错误详情
   */
  constructor(code, message = null, details = null) {
    const errorInfo = getErrorInfo(code);

    // 使用传入的消息或错误码定义的消息
    super(message || errorInfo.message);

    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = errorInfo.status;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * 创建 JSON 响应对象
   * @returns {Object}
   */
  toJSON() {
    const response = {
      success: false,
      errorCode: this.code,
      message: this.message,
      timestamp: new Date().toISOString()
    };

    if (this.details && Object.keys(this.details).length > 0) {
      response.details = this.details;
    }

    return response;
  }

  /**
   * 静态方法：创建未知错误
   */
  static unknown(message = 'Unknown error') {
    return new AppError('ERR_COMMON_001', message);
  }

  /**
   * 静态方法：创建参数错误
   */
  static invalidParameter(message = 'Invalid parameter', details = null) {
    return new AppError('ERR_COMMON_002', message, details);
  }

  /**
   * 静态方法：创建缺少参数错误
   */
  static missingParameter(parameterName) {
    return new AppError('ERR_COMMON_003', `Missing required parameter: ${parameterName}`, { parameter: parameterName });
  }

  /**
   * 静态方法：创建未授权错误
   */
  static unauthorized(message = 'Unauthorized') {
    return new AppError('ERR_COMMON_004', message);
  }

  /**
   * 静态方法：创建禁止访问错误
   */
  static forbidden(message = 'Forbidden') {
    return new AppError('ERR_COMMON_005', message);
  }

  /**
   * 静态方法：创建资源不存在错误
   */
  static notFound(resource = 'Resource') {
    return new AppError('ERR_COMMON_006', `${resource} not found`);
  }

  /**
   * 静态方法：创建服务器错误
   */
  static internal(message = 'Internal server error', details = null) {
    return new AppError('ERR_COMMON_009', message, details);
  }

  /**
   * 静态方法：创建服务不可用错误
   */
  static serviceUnavailable(message = 'Service unavailable') {
    return new AppError('ERR_COMMON_010', message);
  }

  /**
   * 静态方法：从原始错误创建 AppError
   */
  static fromError(error, code = 'ERR_COMMON_001') {
    if (error instanceof AppError) {
      return error;
    }

    const appError = new AppError(code, error.message);
    appError.stack = error.stack;
    return appError;
  }
}

module.exports = AppError;
