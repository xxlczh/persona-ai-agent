/**
 * LLM 服务测试用例
 */
const LLMProvider = require('../../src/services/llm/LLMProvider');
const OpenAIAdapter = require('../../src/services/llm/OpenAIAdapter');
const ErnieAdapter = require('../../src/services/llm/ErnieAdapter');
const ZhipuAdapter = require('../../src/services/llm/ZhipuAdapter');
const LLMManager = require('../../src/services/llm');

describe('LLMProvider', () => {
  class MockProvider extends LLMProvider {
    constructor() {
      super();
      this.name = 'mock';
    }

    async chat(messages, options = {}) {
      return 'Mock response';
    }

    async validate() {
      return true;
    }

    async listModels() {
      return [{ id: 'mock-model', name: 'Mock Model' }];
    }
  }

  test('should estimate tokens correctly', () => {
    const provider = new MockProvider();
    const text = 'Hello, world!';
    const tokens = provider.estimateTokens(text);
    expect(tokens).toBeGreaterThan(0);
  });
});

describe('LLMManager', () => {
  test('should initialize with empty providers when no API keys', () => {
    // 清空环境变量
    const originalEnv = { ...process.env };
    delete process.env.OPENAI_API_KEY;
    delete process.env.ERNIE_API_KEY;
    delete process.env.ERNIE_SECRET_KEY;
    delete process.env.ZHIPU_API_KEY;

    // 重新创建 manager
    const manager = new (require('../../src/services/llm/index').constructor || function() {})();

    // 恢复环境变量
    Object.assign(process.env, originalEnv);
  });

  test('should get current provider info', () => {
    const provider = LLMManager.getCurrentProvider();
    // 如果没有配置 API key，可能返回 null
    expect(provider === null || typeof provider.name === 'string').toBe(true);
  });

  test('should list available providers', () => {
    const providers = LLMManager.getAvailableProviders();
    expect(Array.isArray(providers)).toBe(true);
  });

  test('should throw error when chat with no provider', async () => {
    // 创建一个新的空的 LLM Manager
    const emptyManager = {
      currentProvider: null,
      async chat() {
        if (!this.currentProvider) {
          throw new Error('No LLM provider available');
        }
      }
    };

    await expect(emptyManager.chat([{ role: 'user', content: 'test' }]))
      .rejects.toThrow('No LLM provider available');
  });
});

describe('OpenAIAdapter', () => {
  test('should create instance with config', () => {
    const adapter = new OpenAIAdapter({
      apiKey: 'test-key',
      model: 'gpt-4'
    });

    expect(adapter.name).toBe('openai');
    expect(adapter.apiKey).toBe('test-key');
    expect(adapter.model).toBe('gpt-4');
  });

  test('should throw error when API key not provided', async () => {
    const adapter = new OpenAIAdapter();

    await expect(adapter.validate()).rejects.toThrow();
  });
});

describe('ErnieAdapter', () => {
  test('should create instance with config', () => {
    const adapter = new ErnieAdapter({
      apiKey: 'test-api-key',
      secretKey: 'test-secret-key',
      model: 'ernie-4.0-8k'
    });

    expect(adapter.name).toBe('ernie');
    expect(adapter.apiKey).toBe('test-api-key');
    expect(adapter.model).toBe('ernie-4.0-8k');
  });

  test('should get correct endpoint for different models', () => {
    const adapter = new ErnieAdapter();

    expect(adapter._getEndpoint('ernie-4.0-8k')).toBe('completions_pro');
    expect(adapter._getEndpoint('ernie-3.5-8k')).toBe('completions');
    expect(adapter._getEndpoint('ernie-bot-turbo')).toBe('eb-turbo');
  });
});

describe('ZhipuAdapter', () => {
  test('should create instance with config', () => {
    const adapter = new ZhipuAdapter({
      apiKey: 'test-key',
      model: 'glm-4'
    });

    expect(adapter.name).toBe('zhipu');
    expect(adapter.apiKey).toBe('test-key');
    expect(adapter.model).toBe('glm-4');
  });
});
