/**
 * API 响应封装工具
 * 统一 API 响应格式
 */

const apiResponse = {
  /**
   * 成功响应
   * @param {Object} res - Express response 对象
   * @param {*} data - 响应数据
   * @param {string} message - 成功消息
   * @param {number} statusCode - HTTP 状态码
   */
  success(res, data = null, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  },

  /**
   * 成功响应 - 带分页
   * @param {Object} res - Express response 对象
   * @param {Array} data - 响应数据数组
   * @param {Object} pagination - 分页信息
   * @param {number} pagination.total - 总数
   * @param {number} pagination.page - 当前页
   * @param {number} pagination.pageSize - 每页数量
   */
  successWithPagination(res, data, pagination, message = 'Success') {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        total: pagination.total,
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalPages: Math.ceil(pagination.total / pagination.pageSize)
      },
      timestamp: new Date().toISOString()
    });
  },

  /**
   * 创建响应 - 用于链式调用
   * @param {boolean} success - 是否成功
   * @param {number} statusCode - HTTP 状态码
   * @param {string} message - 消息
   * @param {*} data - 数据
   * @param {string} errorCode - 错误码
   */
  create(success, statusCode, message, data = null, errorCode = null) {
    const response = {
      success,
      message,
      timestamp: new Date().toISOString()
    };

    if (data !== null) {
      response.data = data;
    }

    if (errorCode !== null) {
      response.errorCode = errorCode;
    }

    return {
      status: statusCode,
      body: response
    };
  }
};

module.exports = apiResponse;
