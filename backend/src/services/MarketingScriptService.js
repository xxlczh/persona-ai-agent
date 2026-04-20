/**
 * 营销脚本生成服务
 * 根据用户画像生成营销内容
 */

const { MarketingScript, Persona, Project } = require('../models');
const llmManager = require('./llm');
const ExtensionPrompts = require('../prompts/ExtensionPrompts');

class MarketingScriptService {
  constructor(options = {}) {
    this.options = options;
    this.llmProvider = null;
  }

  /**
   * 初始化 LLM
   */
  async initLLM(modelType = 'openai') {
    if (modelType && llmManager.providers[modelType]) {
      llmManager.switchProvider(modelType);
    }
    this.llmProvider = llmManager.currentProvider;
    return this.llmProvider;
  }

  /**
   * 生成营销脚本
   */
  async generate({ projectId, personaId, persona, options = {}, userId }) {
    // 1. 获取画像数据
    if (personaId && !persona) {
      persona = await Persona.findByPk(personaId);
      if (!persona) {
        throw new Error('画像不存在');
      }
      persona = persona.toJSON ? persona.toJSON() : persona;
    }

    if (!persona) {
      throw new Error('缺少画像数据');
    }

    // 2. 初始化 LLM
    await this.initLLM(options.modelType);

    // 3. 构建 Prompt
    const prompt = ExtensionPrompts.getMarketingScriptPrompt(persona, {
      scriptType: options.scriptType || 'video',
      duration: options.duration || 30,
      targetChannel: options.targetChannel || ''
    });

    // 4. 调用 LLM
    const response = await this.llmProvider.chat([prompt], {
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 4000
    });

    // 5. 解析 JSON
    const scriptData = this.parseJSONResponse(response);

    // 6. 保存到数据库
    const script = await MarketingScript.create({
      project_id: projectId,
      persona_id: personaId || null,
      name: scriptData.script_name || scriptData.ad_headline || '未命名脚本',
      type: options.scriptType || 'video',
      content: scriptData.script_content || scriptData,
      target_channels: options.targetChannel ? [options.targetChannel] : [],
      duration: options.duration || null,
      status: 'draft',
      created_by: userId
    });

    return script;
  }

  /**
   * 解析 JSON
   */
  parseJSONResponse(response) {
    if (!response) {
      throw new Error('LLM 返回为空');
    }

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('无法从响应中解析 JSON');
    }

    try {
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('JSON 解析失败:', error.message);
      throw new Error('JSON 解析失败: ' + error.message);
    }
  }

  /**
   * 获取项目的所有脚本
   */
  async getByProject(projectId, options = {}) {
    const { limit = 20, offset = 0, type } = options;

    const where = { project_id: projectId };
    if (type) {
      where.type = type;
    }

    return MarketingScript.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        { model: Persona, as: 'persona', attributes: ['id', 'name'] }
      ]
    });
  }

  /**
   * 获取脚本详情
   */
  async getById(id) {
    return MarketingScript.findByPk(id, {
      include: [
        { model: Persona, as: 'persona' },
        { model: Project, as: 'project' }
      ]
    });
  }

  /**
   * 更新脚本
   */
  async update(id, data) {
    const script = await MarketingScript.findByPk(id);
    if (!script) {
      throw new Error('脚本不存在');
    }

    const allowedFields = ['name', 'content', 'type', 'target_channels', 'duration', 'status'];
    const updateData = {};

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    await script.update(updateData);
    return script;
  }

  /**
   * 删除脚本
   */
  async delete(id) {
    const script = await MarketingScript.findByPk(id);
    if (!script) {
      throw new Error('脚本不存在');
    }

    await script.destroy();
    return { success: true };
  }

  /**
   * 导出脚本
   */
  async exportScript(id) {
    const script = await this.getById(id);
    if (!script) {
      throw new Error('脚本不存在');
    }

    await script.increment('usage_count');

    return {
      id: script.id,
      name: script.name,
      type: script.type,
      content: script.content,
      targetChannels: script.target_channels,
      duration: script.duration,
      status: script.status
    };
  }
}

module.exports = MarketingScriptService;
