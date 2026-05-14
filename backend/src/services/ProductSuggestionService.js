/**
 * 产品建议服务
 * 根据用户画像生成产品功能建议报告
 */

const { ProductSuggestion, Persona, Project, User } = require('../models');
const llmManager = require('./llm');
const ExtensionPrompts = require('../prompts/ExtensionPrompts');

class ProductSuggestionService {
  constructor(options = {}) {
    this.options = options;
    this.llmProvider = null;
  }

  /**
   * 初始化 LLM
   */
  async initLLM(modelType = 'deepseek') {
    if (modelType && llmManager.providers[modelType]) {
      llmManager.switchProvider(modelType);
    }
    this.llmProvider = llmManager.currentProvider;
    return this.llmProvider;
  }

  /**
   * 生成产品建议报告
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
    const prompt = ExtensionPrompts.getProductSuggestionPrompt(persona, {
      includeCompetitorAnalysis: options.includeCompetitorAnalysis !== false,
      priorityLevel: options.priorityLevel || 'high'
    });

    // 4. 调用 LLM
    const response = await this.llmProvider.chat([prompt], {
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 4000
    });

    // 5. 解析 JSON
    const reportData = this.parseJSONResponse(response);

    // 6. 保存到数据库
    let confidenceScore = reportData.confidence_score || null
    // 如果 confidence_score > 1，假设它是百分比（如 82 表示 82%），转换为小数（如 0.82）
    if (confidenceScore !== null && confidenceScore > 1) {
      confidenceScore = confidenceScore / 100
    }
    // 确保在有效范围内
    if (confidenceScore !== null && (confidenceScore < 0 || confidenceScore > 1)) {
      confidenceScore = confidenceScore > 1 ? 0.99 : 0
    }
    const report = await ProductSuggestion.create({
      project_id: projectId,
      persona_id: personaId || null,
      name: reportData.report_title || '产品建议报告',
      summary: reportData.executive_summary || '',
      suggestions: reportData.suggestions || [],
      priorities: reportData.priorities || {},
      competitor_analysis: reportData.competitor_analysis || null,
      confidence_score: confidenceScore,
      status: 'draft',
      created_by: userId
    });

    return report;
  }

  /**
   * 解析 JSON
   */
  parseJSONResponse(response) {
    if (!response) {
      throw new Error('LLM 返回为空');
    }

    // 尝试多种方式解析 JSON
    // 1. 先尝试直接解析（LLM 返回纯 JSON 的情况）
    try {
      return JSON.parse(response);
    } catch (e) {
      // 2. 尝试找 JSON 代码块 ```json ... ```
      const jsonBlockMatch = response.match(/```json\s*([\s\S]*?)```/);
      if (jsonBlockMatch) {
        try {
          return JSON.parse(jsonBlockMatch[1]);
        } catch (e2) {
          // 继续尝试其他方式
        }
      }

      // 3. 尝试找 ``` ... ``` 包裹的 JSON
      const codeBlockMatch = response.match(/```\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        try {
          return JSON.parse(codeBlockMatch[1]);
        } catch (e3) {
          // 继续尝试其他方式
        }
      }

      // 4. 尝试找 { 到最后一个 } 的完整 JSON 对象（处理 Markdown 包裹的情况）
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e4) {
          console.error('JSON 解析失败:', e4.message);
          throw new Error('JSON 解析失败: ' + e4.message);
        }
      }

      throw new Error('无法从响应中解析 JSON');
    }
  }

  /**
   * 获取项目的所有建议
   */
  async getByProject(projectId, options = {}) {
    const { limit = 20, offset = 0 } = options;

    return ProductSuggestion.findAndCountAll({
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
   * 获取建议详情
   */
  async getById(id) {
    return ProductSuggestion.findByPk(id, {
      include: [
        { model: Persona, as: 'persona' },
        {
          model: Project,
          as: 'project',
          include: [{ model: User, as: 'owner', attributes: ['id', 'username', 'nickname'] }]
        }
      ]
    });
  }

  /**
   * 更新建议
   */
  async update(id, data) {
    const report = await ProductSuggestion.findByPk(id);
    if (!report) {
      throw new Error('建议不存在');
    }

    const allowedFields = ['name', 'summary', 'suggestions', 'priorities', 'competitor_analysis', 'status'];
    const updateData = {};

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    await report.update(updateData);
    return report;
  }

  /**
   * 删除建议
   */
  async delete(id) {
    const report = await ProductSuggestion.findByPk(id);
    if (!report) {
      throw new Error('建议不存在');
    }

    await report.destroy();
    return { success: true };
  }

  /**
   * 导出建议报告
   */
  async exportReport(id) {
    const report = await this.getById(id);
    if (!report) {
      throw new Error('建议不存在');
    }

    await report.increment('usage_count');

    return {
      id: report.id,
      name: report.name,
      summary: report.summary,
      suggestions: report.suggestions,
      priorities: report.priorities,
      competitorAnalysis: report.competitor_analysis,
      status: report.status
    };
  }
}

module.exports = ProductSuggestionService;
