/**
 * LLM 服务管理器
 * 提供统一的 LLM 调用接口，支持多模型切换
 */
const OpenAIAdapter = require('./OpenAIAdapter');
const ErnieAdapter = require('./ErnieAdapter');
const ZhipuAdapter = require('./ZhipuAdapter');

class LLMManager {
  constructor() {
    this.providers = {};
    this.currentProvider = null;
    this.defaultProvider = process.env.DEFAULT_LLM_PROVIDER || 'openai';

    // 初始化所有适配器
    this._initProviders();
  }

  /**
   * 初始化所有 LLM 适配器
   */
  _initProviders() {
    // OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.providers.openai = new OpenAIAdapter({
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL
      });
    }

    // 百度文心一言
    if (process.env.ERNIE_API_KEY && process.env.ERNIE_SECRET_KEY) {
      this.providers.ernie = new ErnieAdapter({
        apiKey: process.env.ERNIE_API_KEY,
        secretKey: process.env.ERNIE_SECRET_KEY,
        model: process.env.ERNIE_MODEL
      });
    }

    // 智谱 GLM
    if (process.env.ZHIPU_API_KEY) {
      this.providers.zhipu = new ZhipuAdapter({
        apiKey: process.env.ZHIPU_API_KEY,
        model: process.env.ZHIPU_MODEL
      });
    }

    // 设置默认提供商
    if (this.providers[this.defaultProvider]) {
      this.currentProvider = this.providers[this.defaultProvider];
    } else {
      // 如果默认提供商不可用，使用第一个可用的
      const availableProviders = Object.keys(this.providers);
      if (availableProviders.length > 0) {
        this.currentProvider = this.providers[availableProviders[0]];
        this.defaultProvider = availableProviders[0];
      }
    }
  }

  /**
   * 切换 LLM 提供商
   * @param {string} providerName - 提供商名称: 'openai' | 'ernie' | 'zhipu'
   * @returns {boolean} - 切换是否成功
   */
  switchProvider(providerName) {
    if (!this.providers[providerName]) {
      throw new Error(`Provider '${providerName}' is not available`);
    }

    this.currentProvider = this.providers[providerName];
    this.defaultProvider = providerName;
    return true;
  }

  /**
   * 发送聊天请求
   * @param {Array} messages - 消息数组
   * @param {Object} options - 可选参数
   * @returns {Promise<string>}
   */
  async chat(messages, options = {}) {
    if (!this.currentProvider) {
      throw new Error('No LLM provider available. Please configure at least one provider.');
    }

    // 如果指定了提供商，使用指定的
    if (options.provider) {
      const originalProvider = this.currentProvider;
      this.switchProvider(options.provider);
      try {
        return await this.currentProvider.chat(messages, options);
      } finally {
        this.switchProvider(originalProvider.name);
      }
    }

    return this.currentProvider.chat(messages, options);
  }

  /**
   * 流式聊天请求
   * @param {Array} messages
   * @param {Function} onChunk
   * @param {Object} options
   * @returns {Promise<string>}
   */
  async chatStream(messages, onChunk, options = {}) {
    if (!this.currentProvider) {
      throw new Error('No LLM provider available. Please configure at least one provider.');
    }

    if (options.provider) {
      const originalProvider = this.currentProvider;
      this.switchProvider(options.provider);
      try {
        return await this.currentProvider.chatStream(messages, onChunk, options);
      } finally {
        this.switchProvider(originalProvider.name);
      }
    }

    return this.currentProvider.chatStream(messages, onChunk, options);
  }

  /**
   * 获取当前提供商信息
   * @returns {Object}
   */
  getCurrentProvider() {
    if (!this.currentProvider) {
      return null;
    }

    return {
      name: this.currentProvider.name,
      model: this.currentProvider.model
    };
  }

  /**
   * 获取所有可用的提供商
   * @returns {Array}
   */
  getAvailableProviders() {
    return Object.keys(this.providers);
  }

  /**
   * 获取所有可用的模型
   * @returns {Promise<Array>}
   */
  async listModels() {
    const allModels = [];

    for (const [providerName, provider] of Object.entries(this.providers)) {
      try {
        const models = await provider.listModels();
        allModels.push(...models.map(m => ({
          ...m,
          provider: providerName
        })));
      } catch (error) {
        console.error(`Failed to list models for ${providerName}:`, error.message);
      }
    }

    return allModels;
  }

  /**
   * 验证所有配置
   * @returns {Promise<Object>}
   */
  async validate() {
    const results = {};

    for (const [providerName, provider] of Object.entries(this.providers)) {
      try {
        await provider.validate();
        results[providerName] = { valid: true };
      } catch (error) {
        results[providerName] = { valid: false, error: error.message };
      }
    }

    return results;
  }
}

// 导出单例
module.exports = new LLMManager();
