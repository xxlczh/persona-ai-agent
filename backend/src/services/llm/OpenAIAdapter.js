/**
 * OpenAI 适配器
 * 支持 GPT-3.5, GPT-4 等模型
 */
const axios = require('axios');
const LLMProvider = require('./LLMProvider');

class OpenAIAdapter extends LLMProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'openai';
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    this.model = config.model || process.env.OPENAI_MODEL || 'gpt-4';
    this.baseURL = config.baseURL || 'https://api.openai.com/v1';

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
   * @param {Array} messages - 消息数组
   * @param {Object} options - 可选参数
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
      max_tokens: options.max_tokens || 2048,
      top_p: options.top_p || 1,
      frequency_penalty: options.frequency_penalty || 0,
      presence_penalty: options.presence_penalty || 0
    };

    if (options.stream) {
      throw new Error('Use chatStream() for streaming');
    }

    try {
      const response = await this.client.post('/chat/completions', payload);

      if (response.data.choices && response.data.choices.length > 0) {
        return response.data.choices[0].message.content;
      }

      throw new Error('No response from OpenAI');
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
    const payload = {
      model: options.model || this.model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens || 2048,
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
   * @returns {Promise<Array>}
   */
  async listModels() {
    try {
      const response = await this.client.get('/models');
      return response.data.data.map(model => ({
        id: model.id,
        name: model.id,
        created: model.created,
        owned_by: model.owned_by
      }));
    } catch (error) {
      this._handleError(error);
    }
  }

  /**
   * 验证 API 配置
   * @returns {Promise<boolean>}
   */
  async validate() {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    try {
      await this.client.get('/models');
      return true;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Invalid OpenAI API key');
      }
      throw error;
    }
  }

  /**
   * 处理错误
   * @param {Error} error
   */
  _handleError(error) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      if (status === 401) {
        throw new Error('OpenAI API key is invalid or expired');
      } else if (status === 429) {
        throw new Error('OpenAI API rate limit exceeded');
      } else if (status === 500) {
        throw new Error('OpenAI server error, please try again later');
      } else if (data?.error?.message) {
        throw new Error(`OpenAI error: ${data.error.message}`);
      }
    }

    throw error;
  }
}

module.exports = OpenAIAdapter;
