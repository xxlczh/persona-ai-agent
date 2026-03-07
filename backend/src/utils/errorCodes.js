/**
 * 统一错误码定义
 * 错误码格式: ERR_模块_序号
 * 例如: ERR_AUTH_001, ERR_USER_001
 */

// 错误码枚举
const ErrorCodes = {
  // 通用错误 (1xxx)
  UNKNOWN: { code: 'ERR_COMMON_001', message: '未知错误', status: 500 },
  INVALID_PARAMETER: { code: 'ERR_COMMON_002', message: '参数错误', status: 400 },
  MISSING_PARAMETER: { code: 'ERR_COMMON_003', message: '缺少必要参数', status: 400 },
  UNAUTHORIZED: { code: 'ERR_COMMON_004', message: '未授权', status: 401 },
  FORBIDDEN: { code: 'ERR_COMMON_005', message: '禁止访问', status: 403 },
  NOT_FOUND: { code: 'ERR_COMMON_006', message: '资源不存在', status: 404 },
  METHOD_NOT_ALLOWED: { code: 'ERR_COMMON_007', message: '方法不允许', status: 405 },
  CONFLICT: { code: 'ERR_COMMON_008', message: '资源冲突', status: 409 },
  INTERNAL_SERVER_ERROR: { code: 'ERR_COMMON_009', message: '服务器内部错误', status: 500 },
  SERVICE_UNAVAILABLE: { code: 'ERR_COMMON_010', message: '服务不可用', status: 503 },
  TOO_MANY_REQUESTS: { code: 'ERR_COMMON_011', message: '请求过于频繁', status: 429 },

  // 认证错误 (2xxx)
  AUTH_INVALID_TOKEN: { code: 'ERR_AUTH_001', message: '无效的令牌', status: 401 },
  AUTH_EXPIRED_TOKEN: { code: 'ERR_AUTH_002', message: '令牌已过期', status: 401 },
  AUTH_MISSING_TOKEN: { code: 'ERR_AUTH_003', message: '缺少令牌', status: 401 },
  AUTH_INVALID_CREDENTIALS: { code: 'ERR_AUTH_004', message: '用户名或密码错误', status: 401 },

  // 用户错误 (3xxx)
  USER_NOT_FOUND: { code: 'ERR_USER_001', message: '用户不存在', status: 404 },
  USER_ALREADY_EXISTS: { code: 'ERR_USER_002', message: '用户已存在', status: 409 },
  USER_DISABLED: { code: 'ERR_USER_003', message: '用户已被禁用', status: 403 },
  USER_INVALID_PASSWORD: { code: 'ERR_USER_004', message: '密码格式不正确', status: 400 },

  // 项目错误 (4xxx)
  PROJECT_NOT_FOUND: { code: 'ERR_PROJECT_001', message: '项目不存在', status: 404 },
  PROJECT_ALREADY_EXISTS: { code: 'ERR_PROJECT_002', message: '项目已存在', status: 409 },
  PROJECT_ACCESS_DENIED: { code: 'ERR_PROJECT_003', message: '无权访问此项目', status: 403 },

  // 数据源错误 (5xxx)
  DATASOURCE_NOT_FOUND: { code: 'ERR_DATASOURCE_001', message: '数据源不存在', status: 404 },
  DATASOURCE_INVALID: { code: 'ERR_DATASOURCE_002', message: '数据源配置无效', status: 400 },
  DATASOURCE_CONNECTION_FAILED: { code: 'ERR_DATASOURCE_003', message: '数据源连接失败', status: 500 },

  // 用户画像错误 (6xxx)
  PERSONA_NOT_FOUND: { code: 'ERR_PERSONA_001', message: '用户画像不存在', status: 404 },
  PERSONA_GENERATION_FAILED: { code: 'ERR_PERSONA_002', message: '用户画像生成失败', status: 500 },
  PERSONA_VALIDATION_FAILED: { code: 'ERR_PERSONA_003', message: '用户画像验证失败', status: 400 },

  // 评估错误 (7xxx)
  EVALUATION_NOT_FOUND: { code: 'ERR_EVALUATION_001', message: '评估记录不存在', status: 404 },
  EVALUATION_FAILED: { code: 'ERR_EVALUATION_002', message: '评估失败', status: 500 },

  // LLM 错误 (8xxx)
  LLM_PROVIDER_NOT_FOUND: { code: 'ERR_LLM_001', message: 'LLM 提供商不存在', status: 404 },
  LLM_API_ERROR: { code: 'ERR_LLM_002', message: 'LLM API 调用失败', status: 502 },
  LLM_TIMEOUT: { code: 'ERR_LLM_003', message: 'LLM 请求超时', status: 504 },
  LLM_RATE_LIMIT: { code: 'ERR_LLM_004', message: 'LLM 请求频率超限', status: 429 },
  LLM_QUOTA_EXCEEDED: { code: 'ERR_LLM_005', message: 'LLM 配额不足', status: 402 },

  // 数据库错误 (9xxx)
  DB_CONNECTION_FAILED: { code: 'ERR_DB_001', message: '数据库连接失败', status: 500 },
  DB_QUERY_FAILED: { code: 'ERR_DB_002', message: '数据库查询失败', status: 500 },
  DB_TRANSACTION_FAILED: { code: 'ERR_DB_003', message: '数据库事务失败', status: 500 },

  // 缓存错误 (10xxx)
  CACHE_CONNECTION_FAILED: { code: 'ERR_CACHE_001', message: '缓存连接失败', status: 500 },
  CACHE_OPERATION_FAILED: { code: 'ERR_CACHE_002', message: '缓存操作失败', status: 500 }
};

/**
 * 获取错误码信息
 * @param {string} code - 错误码
 * @returns {Object} 错误码信息
 */
const getErrorInfo = (code) => {
  return ErrorCodes[code] || ErrorCodes.UNKNOWN;
};

module.exports = {
  ErrorCodes,
  getErrorInfo
};
