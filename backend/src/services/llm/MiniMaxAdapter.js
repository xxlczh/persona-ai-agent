/**
 * MiniMax 适配器
 * 支持 MiniMax-Text-01 等模型
 */
const axios = require('axios');
const LLMProvider = require('./LLMProvider');

class MiniMaxAdapter extends LLMProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'minimax';
    this.apiKey = config.apiKey || process.env.MINIMAX_API_KEY;
    this.model = config.model || process.env.MINIMAX_MODEL || 'Minimax-Text-01';
    this.baseURL = 'https://api.minimax.chat/v1';

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * 发送聊天请求
   * @param {Array} messages
   * @param {Object} options
   * @returns {Promise<string>}
   */
  async chat(messages, options = {}) {
    const payload = {
      model: options.model || this.model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens || 4096
    };

    try {
      const response = await this.client.post('/chat/completions', payload);

      if (response.data.choices && response.data.choices.length > 0) {
        return response.data.choices[0].message.content;
      }

      throw new Error('No response from MiniMax');
    } catch (error) {
      this._handleError(error);
    }
  }

  /**
   * 流式聊天请求
   */
  async chatStream(messages, onChunk, options = {}) {
    const payload = {
      model: options.model || this.model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens || 4096,
      stream: true
    };

    try {
      const response = await this.client.post('/chat/completions', payload, {
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
                if (parsed.choices && parsed.choices[0].delta.content) {
                  const content = parsed.choices[0].delta.content;
                  fullContent += content;
                  onChunk(content);
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
   * 获取可用模型列表
   */
  async listModels() {
    return [
      { id: 'Minimax-Text-01', name: 'MiniMax Text 01' }
    ];
  }

  /**
   * 验证 API 配置
   */
  async validate() {
    if (!this.apiKey) {
      throw new Error('MiniMax API key is not configured');
    }

    try {
      await this.client.post('/chat/completions', {
        model: this.model,
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1
      });
      return true;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Invalid MiniMax API key');
      }
      throw error;
    }
  }

  /**
   * 处理错误
   */
  _handleError(error) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      if (status === 401) {
        throw new Error('MiniMax API key is invalid or expired');
      } else if (status === 429) {
        throw new Error('MiniMax API rate limit exceeded');
      } else if (data?.error?.message) {
        throw new Error(`MiniMax error: ${data.error.message}`);
      }
    }

    throw error;
  }
}

module.exports = MiniMaxAdapter;