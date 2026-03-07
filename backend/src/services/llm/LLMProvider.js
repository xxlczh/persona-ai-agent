/**
 * LLM 服务基类
 * 定义 LLM 适配器的统一接口
 */
class LLMProvider {
  constructor(config = {}) {
    this.config = config;
    this.name = 'base';
  }

  /**
   * 发送聊天请求
   * @param {Array} messages - 消息数组 [{role: 'user'|'system'|'assistant', content: '...'}]
   * @param {Object} options - 可选参数 {temperature, max_tokens, ...}
   * @returns {Promise<string>} - 返回生成的文本
   */
  async chat(messages, options = {}) {
    throw new Error('chat() must be implemented by subclass');
  }

  /**
   * 流式聊天请求
   * @param {Array} messages - 消息数组
   * @param {Function} onChunk - 每个 chunk 的回调函数
   * @param {Object} options - 可选参数
   */
  async chatStream(messages, onChunk, options = {}) {
    throw new Error('chatStream() must be implemented by subclass');
  }

  /**
   * 获取模型列表
   * @returns {Promise<Array>} - 返回可用模型列表
   */
  async listModels() {
    throw new Error('listModels() must be implemented by subclass');
  }

  /**
   * 验证配置是否正确
   * @returns {Promise<boolean>}
   */
  async validate() {
    throw new Error('validate() must be implemented by subclass');
  }

  /**
   * 估算 token 数量 (简化实现)
   * @param {string} text
   * @returns {number}
   */
  estimateTokens(text) {
    // 简单估算: 平均 1 token ≈ 4 字符 (中文 ≈ 1-2 字符 per token)
    return Math.ceil(text.length / 4);
  }
}

module.exports = LLMProvider;
