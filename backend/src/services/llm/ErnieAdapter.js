/**
 * 百度文心一言适配器
 * 支持 ERNIE-Bot, ERNIE-Bot-turbo 等模型
 */
const axios = require('axios');
const crypto = require('crypto');
const LLMProvider = require('./LLMProvider');

class ErnieAdapter extends LLMProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'ernie';
    this.apiKey = config.apiKey || process.env.ERNIE_API_KEY;
    this.secretKey = config.secretKey || process.env.ERNIE_SECRET_KEY;
    this.model = config.model || process.env.ERNIE_MODEL || 'ernie-4.0-8k';
    this.baseURL = 'https://aip.baidubce.com';

    // 缓存 access_token
    this._accessToken = null;
    this._tokenExpiresAt = 0;
  }

  /**
   * 获取访问令牌
   * @returns {Promise<string>}
   */
  async _getAccessToken() {
    const now = Date.now();

    if (this._accessToken && now < this._tokenExpiresAt) {
      return this._accessToken;
    }

    const tokenURL = `${this.baseURL}/oauth/2.0/token`;
    const params = {
      grant_type: 'client_credentials',
      client_id: this.apiKey,
      client_secret: this.secretKey
    };

    try {
      const response = await axios.get(tokenURL, { params });
      this._accessToken = response.data.access_token;
      // 提前5分钟过期
      this._tokenExpiresAt = now + (response.data.expires_in - 300) * 1000;
      return this._accessToken;
    } catch (error) {
      throw new Error(`Failed to get Baidu access token: ${error.message}`);
    }
  }

  /**
   * 发送聊天请求
   * @param {Array} messages
   * @param {Object} options
   * @returns {Promise<string>}
   */
  async chat(messages, options = {}) {
    const accessToken = await this._getAccessToken();
    const url = `${this.baseURL}/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/${this._getEndpoint(options.model || this.model)}`;

    const payload = {
      messages: this._formatMessages(messages),
      temperature: options.temperature ?? 0.7,
      max_output_tokens: options.max_tokens || 2048,
      top_p: options.top_p || 0.9,
      stream: false
    };

    try {
      const response = await axios.post(url, payload, {
        params: { access_token: accessToken },
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data.error_code) {
        throw new Error(`Baidu API error: ${response.data.error_msg}`);
      }

      return response.data.result;
    } catch (error) {
      this._handleError(error);
    }
  }

  /**
   * 流式聊天请求
   * @param {Array} messages
   * @param {Function} onChunk
   * @param {Object} options
   */
  async chatStream(messages, onChunk, options = {}) {
    const accessToken = await this._getAccessToken();
    const url = `${this.baseURL}/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/${this._getEndpoint(options.model || this.model)}`;

    const payload = {
      messages: this._formatMessages(messages),
      temperature: options.temperature ?? 0.7,
      max_output_tokens: options.max_tokens || 2048,
      top_p: options.top_p || 0.9,
      stream: true
    };

    try {
      const response = await axios.post(url, payload, {
        params: { access_token: accessToken },
        headers: { 'Content-Type': 'application/json' },
        responseType: 'stream'
      });

      return new Promise((resolve, reject) => {
        let fullContent = '';

        response.data.on('data', (chunk) => {
          const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                resolve(fullContent);
                return;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.result) {
                  fullContent += parsed.result;
                  onChunk(parsed.result);
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        });

        response.data.on('error', reject);
        response.data.on('end', () => resolve(fullContent));
      });
    } catch (error) {
      this._handleError(error);
    }
  }

  /**
   * 获取模型端点
   * @param {string} model
   * @returns {string}
   */
  _getEndpoint(model) {
    const endpoints = {
      'ernie-4.0-8k': 'completions_pro',
      'ernie-4.0': 'completions_pro',
      'ernie-3.5-8k': 'completions',
      'ernie-3.5': 'completions',
      'ernie-bot-turbo': 'eb-turbo'
    };
    return endpoints[model] || 'completions_pro';
  }

  /**
   * 格式化消息
   * @param {Array} messages
   * @returns {Array}
   */
  _formatMessages(messages) {
    // 文心一言只支持 user 和 assistant 角色
    return messages.map(msg => ({
      role: msg.role === 'system' ? 'user' : msg.role,
      content: msg.content
    }));
  }

  /**
   * 获取可用模型列表
   * @returns {Promise<Array>}
   */
  async listModels() {
    return [
      { id: 'ernie-4.0-8k', name: 'ERNIE 4.0 8K' },
      { id: 'ernie-3.5-8k', name: 'ERNIE 3.5 8K' },
      { id: 'ernie-bot-turbo', name: 'ERNIE Bot Turbo' }
    ];
  }

  /**
   * 验证 API 配置
   * @returns {Promise<boolean>}
   */
  async validate() {
    if (!this.apiKey || !this.secretKey) {
      throw new Error('Baidu ERNIE API key or secret key is not configured');
    }

    try {
      await this._getAccessToken();
      return true;
    } catch (error) {
      throw new Error(`Failed to validate Baidu credentials: ${error.message}`);
    }
  }

  /**
   * 处理错误
   * @param {Error} error
   */
  _handleError(error) {
    if (error.response?.data?.error_msg) {
      throw new Error(`Baidu ERNIE error: ${error.response.data.error_msg}`);
    }
    throw error;
  }
}

module.exports = ErnieAdapter;
