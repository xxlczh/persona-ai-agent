/**
 * 问卷生成服务
 * 根据用户画像生成用户研究问卷
 */

const { Survey, Persona, Project } = require('../models');
const llmManager = require('./llm');
const ExtensionPrompts = require('../prompts/ExtensionPrompts');

class SurveyService {
  constructor(options = {}) {
    this.options = options;
    this.llmProvider = null;
  }

  /**
   * 初始化 LLM 提供者
   */
  async initLLM(modelType = 'openai') {
    if (modelType && llmManager.providers[modelType]) {
      llmManager.switchProvider(modelType);
    }
    this.llmProvider = llmManager.currentProvider;
    return this.llmProvider;
  }

  /**
   * 生成问卷
   * @param {Object} params - 生成参数
   * @param {number} params.projectId - 项目ID
   * @param {number} params.personaId - 画像ID（可选）
   * @param {Object} params.persona - 画像数据
   * @param {Object} params.options - 配置选项
   * @param {number} params.userId - 用户ID
   * @returns {Promise<Object>} - 生成的问卷
   */
  async generate({ projectId, personaId, persona, options = {}, userId }) {
    // 1. 如果提供了画像ID，获取画像数据
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
    const prompt = ExtensionPrompts.getSurveyPrompt(persona, {
      questionCount: options.questionCount || 15,
      includeLogicJump: options.includeLogicJump !== false,
      targetAudience: options.targetAudience || ''
    });

    // 4. 调用 LLM
    const response = await this.llmProvider.chat([prompt], {
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 3000
    });

    // 5. 解析 JSON 响应
    const surveyData = this.parseJSONResponse(response);

    // 6. 保存到数据库
    const survey = await Survey.create({
      project_id: projectId,
      persona_id: personaId || null,
      name: surveyData.survey_title || '未命名问卷',
      description: surveyData.survey_intro || '',
      target_audience: options.targetAudience || '',
      questions: surveyData.questions || [],
      settings: {
        questionCount: options.questionCount || 15,
        includeLogicJump: options.includeLogicJump !== false,
        estimatedTime: surveyData.estimated_time || 10
      },
      status: 'draft',
      created_by: userId
    });

    return survey;
  }

  /**
   * 解析 JSON 响应
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
   * 获取项目的所有问卷
   */
  async getByProject(projectId, options = {}) {
    const { limit = 20, offset = 0 } = options;

    return Survey.findAndCountAll({
      where: { project_id: projectId },
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        { model: Persona, as: 'persona', attributes: ['id', 'name'] }
      ]
    });
  }

  /**
   * 获取问卷详情
   */
  async getById(id) {
    return Survey.findByPk(id, {
      include: [
        { model: Persona, as: 'persona' },
        { model: Project, as: 'project' }
      ]
    });
  }

  /**
   * 更新问卷
   */
  async update(id, data) {
    const survey = await Survey.findByPk(id);
    if (!survey) {
      throw new Error('问卷不存在');
    }

    const allowedFields = ['name', 'description', 'questions', 'settings', 'status'];
    const updateData = {};

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    await survey.update(updateData);
    return survey;
  }

  /**
   * 删除问卷
   */
  async delete(id) {
    const survey = await Survey.findByPk(id);
    if (!survey) {
      throw new Error('问卷不存在');
    }

    await survey.destroy();
    return { success: true };
  }

  /**
   * 根据问卷ID导出问卷数据
   */
  async exportSurvey(id) {
    const survey = await this.getById(id);
    if (!survey) {
      throw new Error('问卷不存在');
    }

    // 增加使用次数
    await survey.increment('usage_count');

    return {
      id: survey.id,
      name: survey.name,
      description: survey.description,
      targetAudience: survey.target_audience,
      questions: survey.questions,
      settings: survey.settings,
      status: survey.status
    };
  }
}

module.exports = SurveyService;
