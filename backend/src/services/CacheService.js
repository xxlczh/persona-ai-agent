const redis = require('../config/redis');

/**
 * 缓存服务类
 * 提供常用的缓存操作方法
 */
class CacheService {
  constructor() {
    this.defaultTTL = 3600; // 默认缓存时间 1 小时
    this.personaTTL = 1800; // 画像缓存时间 30 分钟
    this.listTTL = 600; // 列表缓存时间 10 分钟
    this.llmTTL = 7200; // LLM 响应缓存 2 小时
    this.statsTTL = 300; // 统计数据缓存 5 分钟
    this.projectTTL = 1800; // 项目缓存 30 分钟
  }

  /**
   * 设置缓存
   * @param {string} key 缓存键
   * @param {any} value 缓存值
   * @param {number} ttl 过期时间(秒)
   */
  async set(key, value, ttl = this.defaultTTL) {
    try {
      const serialized = JSON.stringify(value);
      await redis.setex(key, ttl, serialized);
      return true;
    } catch (error) {
      console.error('缓存设置失败:', error.message);
      return false;
    }
  }

  /**
   * 获取缓存
   * @param {string} key 缓存键
   * @returns {any|null} 缓存值
   */
  async get(key) {
    try {
      const value = await redis.get(key);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      console.error('缓存获取失败:', error.message);
      return null;
    }
  }

  /**
   * 删除缓存
   * @param {string} key 缓存键
   */
  async del(key) {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error('缓存删除失败:', error.message);
      return false;
    }
  }

  /**
   * 批量删除缓存(支持通配符)
   * @param {string} pattern 缓存键模式
   */
  async delByPattern(pattern) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('批量缓存删除失败:', error.message);
      return false;
    }
  }

  /**
   * 检查缓存是否存在
   * @param {string} key 缓存键
   */
  async exists(key) {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('缓存检查失败:', error.message);
      return false;
    }
  }

  // ==================== 画像缓存 ====================

  /**
   * 设置画像缓存
   * @param {number} id 画像ID
   * @param {any} data 画像数据
   */
  async setPersona(id, data) {
    const key = `persona:${id}`;
    return this.set(key, data, this.personaTTL);
  }

  /**
   * 获取画像缓存
   * @param {number} id 画像ID
   */
  async getPersona(id) {
    const key = `persona:${id}`;
    return this.get(key);
  }

  /**
   * 删除画像缓存
   * @param {number} id 画像ID
   */
  async delPersona(id) {
    const key = `persona:${id}`;
    return this.del(key);
  }

  /**
   * 设置画像列表缓存
   * @param {string} cacheKey 缓存键
   * @param {any} data 列表数据
   */
  async setPersonaList(cacheKey, data) {
    const key = `persona:list:${cacheKey}`;
    return this.set(key, data, this.listTTL);
  }

  /**
   * 获取画像列表缓存
   * @param {string} cacheKey 缓存键
   */
  async getPersonaList(cacheKey) {
    const key = `persona:list:${cacheKey}`;
    return this.get(key);
  }

  /**
   * 清除所有画像相关缓存
   */
  async clearPersonaCache() {
    return this.delByPattern('persona:*');
  }

  // ==================== 项目缓存 ====================

  /**
   * 设置项目缓存
   * @param {number} id 项目ID
   * @param {any} data 项目数据
   */
  async setProject(id, data) {
    const key = `project:${id}`;
    return this.set(key, data, this.projectTTL);
  }

  /**
   * 获取项目缓存
   * @param {number} id 项目ID
   */
  async getProject(id) {
    const key = `project:${id}`;
    return this.get(key);
  }

  /**
   * 删除项目缓存
   * @param {number} id 项目ID
   */
  async delProject(id) {
    const key = `project:${id}`;
    return this.del(key);
  }

  /**
   * 清除项目列表缓存
   */
  async clearProjectCache() {
    return this.delByPattern('project:*');
  }

  // ==================== LLM 响应缓存 ====================

  /**
   * 设置 LLM 响应缓存
   * @param {string} promptHash prompt 哈希
   * @param {any} data 响应数据
   */
  async setLLMResponse(promptHash, data) {
    const key = `llm:${promptHash}`;
    return this.set(key, data, this.llmTTL);
  }

  /**
   * 获取 LLM 响应缓存
   * @param {string} promptHash prompt 哈希
   */
  async getLLMResponse(promptHash) {
    const key = `llm:${promptHash}`;
    return this.get(key);
  }

  // ==================== 统计数据缓存 ====================

  /**
   * 设置统计数据缓存
   * @param {string} key 统计键
   * @param {any} data 统计数据
   */
  async setStats(key, data) {
    const cacheKey = `stats:${key}`;
    return this.set(cacheKey, data, this.statsTTL);
  }

  /**
   * 获取统计数据缓存
   * @param {string} key 统计键
   */
  async getStats(key) {
    const cacheKey = `stats:${key}`;
    return this.get(cacheKey);
  }

  /**
   * 清除统计数据缓存
   */
  async clearStatsCache() {
    return this.delByPattern('stats:*');
  }

  // ==================== 工具方法 ====================

  /**
   * 生成列表缓存键
   * @param {object} params 查询参数
   */
  generateListCacheKey(params) {
    const { projectId, status, page, pageSize } = params;
    return `${projectId || 'all'}:${status || 'all'}:${page}:${pageSize}`;
  }

  /**
   * 生成 LLM prompt 哈希键
   * @param {string} prompt prompt 内容
   */
  generateLLMHash(prompt) {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(prompt).digest('hex');
  }
}

module.exports = new CacheService();
