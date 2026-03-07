const { operationLogger } = require('../utils/logger');

/**
 * 操作日志工具
 * 用于记录业务操作日志
 */
class OperationLogger {
  /**
   * 记录操作日志
   * @param {string} operation - 操作名称
   * @param {object} details - 操作详情
   * @param {string} userId - 用户ID（可选）
   */
  static log(operation, details = {}, userId = null) {
    operationLogger.info(`[${operation}]`, {
      operation,
      userId,
      ...details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 记录用户登录
   */
  static login(userId, username, ip) {
    this.log('USER_LOGIN', { username, ip }, userId);
  }

  /**
   * 记录用户登出
   */
  static logout(userId, username) {
    this.log('USER_LOGOUT', { username }, userId);
  }

  /**
   * 记录用户创建
   */
  static createUser(adminId, newUserId, username) {
    this.log('CREATE_USER', { newUserId, username }, adminId);
  }

  /**
   * 记录项目创建
   */
  static createProject(userId, projectId, projectName) {
    this.log('CREATE_PROJECT', { projectId, projectName }, userId);
  }

  /**
   * 记录项目删除
   */
  static deleteProject(userId, projectId, projectName) {
    this.log('DELETE_PROJECT', { projectId, projectName }, userId);
  }

  /**
   * 记录画像生成
   */
  static generateProfile(userId, projectId, profileId) {
    this.log('GENERATE_PROFILE', { projectId, profileId }, userId);
  }

  /**
   * 记录数据源上传
   */
  static uploadDatasource(userId, projectId, datasourceId, filename) {
    this.log('UPLOAD_DATASOURCE', { projectId, datasourceId, filename }, userId);
  }

  /**
   * 记录API调用
   */
  static apiCall(userId, apiName, duration, success) {
    this.log('API_CALL', { apiName, duration, success }, userId);
  }

  /**
   * 记录LLM调用
   */
  static llmCall(userId, model, promptLength, responseLength, duration, success) {
    this.log('LLM_CALL', {
      model,
      promptLength,
      responseLength,
      duration,
      success
    }, userId);
  }

  /**
   * 记录错误
   */
  static error(operation, error, userId = null) {
    operationLogger.error(`[${operation}] Error: ${error.message}`, {
      operation,
      error: {
        message: error.message,
        stack: error.stack
      },
      userId,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = OperationLogger;
