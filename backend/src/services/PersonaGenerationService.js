/**
 * 用户画像生成服务
 * 负责从数据源生成用户画像的完整流程
 */

const { Persona, DataSource, Project } = require('../models');
const llmManager = require('../services/llm');
const PersonaPrompts = require('../prompts/PersonaPrompts');
const fs = require('fs').promises;
const path = require('path');

class PersonaGenerationService {
  constructor(options = {}) {
    this.options = options;
    this.llmProvider = null;
    this.modelType = options.modelType || 'openai';
  }

  /**
   * 初始化 LLM 提供者
   */
  async initLLM(modelType = 'openai') {
    this.modelType = modelType;

    // 如果指定了提供商且可用，切换到该提供商
    if (modelType && llmManager.providers[modelType]) {
      llmManager.switchProvider(modelType);
    }

    this.llmProvider = llmManager.currentProvider;
    return this.llmProvider;
  }

  /**
   * 生成用户画像主流程
   * @param {number} projectId - 项目ID
   * @param {Array<number>} sourceDataIds - 数据源ID数组
   * @param {Object} config - 生成配置
   * @returns {Promise<Object>} - 生成的画像
   */
  async generate(projectId, sourceDataIds, config = {}) {
    const startTime = Date.now();

    // 1. 获取数据源
    const sourceData = await this.fetchSourceData(sourceDataIds);

    // 2. 创建画像记录
    const persona = await Persona.create({
      project_id: projectId,
      name: '生成中...',
      status: 'generating',
      source_data_ids: sourceDataIds,
      generation_config: config
    });

    try {
      // 3. 根据配置选择生成模式
      let result;
      if (config.mode === 'quick') {
        // 快速生成模式
        result = await this.generateQuick(sourceData, config);
      } else {
        // 完整生成模式（分维度）
        result = await this.generateComprehensive(sourceData, config);
      }

      // 4. 更新画像数据
      await persona.update({
        name: result.name || '未命名画像',
        summary: result.summary,
        demographic: result.demographic || {},
        behavioral: result.behavioral || {},
        psychological: result.psychological || {},
        needs: result.needs || {},
        scenario: result.scenario || {},
        personality_tags: result.tags || [],
        communication_style: result.communication_style || '',
        marketing_suggestions: result.marketing_suggestions || [],
        quality_score: result.quality_score || {},
        status: 'completed',
        generated_by: config.modelType || 'auto'
      });

      const duration = Date.now() - startTime;
      console.log(`画像生成完成，耗时: ${duration}ms`);

      return persona;

    } catch (error) {
      // 更新失败状态
      await persona.update({
        status: 'failed',
        error_message: error.message
      });
      throw error;
    }
  }

  /**
   * 获取数据源数据
   * @param {Array<number>} sourceDataIds - 数据源ID数组
   * @returns {Promise<Array>} - 数据源数据
   */
  async fetchSourceData(sourceDataIds) {
    const dataSources = await DataSource.findAll({
      where: {
        id: sourceDataIds,
        status: 'completed'
      }
    });

    const results = [];

    for (const ds of dataSources) {
      try {
        const filePath = path.resolve(ds.file_path);
        const content = await fs.readFile(filePath, 'utf-8');

        let data;
        if (ds.type === 'json') {
          data = JSON.parse(content);
        } else if (ds.type === 'csv') {
          data = this.parseCSV(content);
        } else {
          // 文本文件或其他类型
          data = { raw_text: content };
        }

        results.push({
          id: ds.id,
          name: ds.name,
          type: ds.type,
          data: data,
          metadata: ds.metadata || {}
        });
      } catch (error) {
        console.error(`读取数据源 ${ds.id} 失败:`, error.message);
        results.push({
          id: ds.id,
          name: ds.name,
          type: ds.type,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * 解析 CSV 内容
   * @param {string} csvContent - CSV 内容
   * @returns {Object} - 解析后的数据
   */
  parseCSV(csvContent) {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) return { records: [] };

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const records = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const record = {};
      headers.forEach((header, index) => {
        record[header] = values[index] || '';
      });
      records.push(record);
    }

    return { records };
  }

  /**
   * 解析 CSV 行（处理引号内的逗号）
   */
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/"/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/"/g, ''));

    return result;
  }

  /**
   * 快速生成模式
   * 直接从原始数据生成简化版用户画像
   */
  async generateQuick(sourceData, config) {
    await this.initLLM(config.modelType || 'openai');

    // 合并所有数据源
    const combinedData = this.combineSourceData(sourceData);

    // 构建 Prompt
    const prompt = PersonaPrompts.getQuickPrompt(combinedData);

    // 调用 LLM
    const response = await this.llmProvider.chat([prompt], {
      temperature: config.temperature || 0.7,
      max_tokens: config.max_tokens || 2000
    });

    // 解析 JSON
    const result = this.parseJSONResponse(response);

    return {
      name: result.persona_name || '快速画像',
      summary: result.summary,
      demographic: result.demographics || {},
      behavioral: result.behavioral || {},
      psychological: result.psychological || {},
      needs: result.needs || {},
      tags: result.tags || [],
      communication_style: '',
      marketing_suggestions: result.marketing_tips ? [result.marketing_tips] : [],
      quality_score: {
        completeness: 0.6,
        consistency: 0.7,
        overall: 0.65
      }
    };
  }

  /**
   * 完整生成模式
   * 分维度生成画像（并行优化版本）
   */
  async generateComprehensive(sourceData, config) {
    await this.initLLM(config.modelType || 'openai');

    // 合并所有数据源
    const combinedData = this.combineSourceData(sourceData);

    const llmOptions = {
      temperature: config.temperature || 0.7,
      max_tokens: config.max_tokens || 1500
    };

    // 构建所有 prompts
    const demographicPrompt = PersonaPrompts.getDemographicPrompt(combinedData);
    const behavioralPrompt = PersonaPrompts.getBehavioralPrompt(combinedData);
    const psychologicalPrompt = PersonaPrompts.getPsychologicalPrompt(combinedData);
    const needsPrompt = PersonaPrompts.getNeedsPrompt(combinedData);
    const scenarioPrompt = PersonaPrompts.getScenarioPrompt(combinedData);

    // 并行调用 LLM（优化性能）
    const [demographicResponse, behavioralResponse, psychologicalResponse, needsResponse, scenarioResponse] = await Promise.all([
      this.llmProvider.chat([demographicPrompt], llmOptions),
      this.llmProvider.chat([behavioralPrompt], llmOptions),
      this.llmProvider.chat([psychologicalPrompt], llmOptions),
      this.llmProvider.chat([needsPrompt], llmOptions),
      this.llmProvider.chat([scenarioPrompt], llmOptions)
    ]);

    // 解析各维度结果
    const demographic = this.parseJSONResponse(demographicResponse);
    const behavioral = this.parseJSONResponse(behavioralResponse);
    const psychological = this.parseJSONResponse(psychologicalResponse);
    const needs = this.parseJSONResponse(needsResponse);
    const scenario = this.parseJSONResponse(scenarioResponse);

    // 6. 综合生成最终画像
    const comprehensivePrompt = PersonaPrompts.getComprehensivePrompt(
      demographic,
      behavioral,
      psychological,
      needs,
      scenario
    );
    const comprehensiveResponse = await this.llmProvider.chat([comprehensivePrompt], {
      temperature: config.temperature || 0.7,
      max_tokens: config.max_tokens || 2000
    });
    const comprehensive = this.parseJSONResponse(comprehensiveResponse);

    return {
      name: comprehensive.persona_name || '综合画像',
      summary: comprehensive.summary,
      demographic: this.mergeDemographic(demographic, comprehensive.demographic),
      behavioral: this.mergeBehavioral(behavioral, comprehensive.behavioral),
      psychological: this.mergePsychological(psychological, comprehensive.psychological),
      needs: this.mergeNeeds(needs, comprehensive.needs),
      scenario: this.mergeScenario(scenario, comprehensive.scenario),
      tags: comprehensive.personality_tags || [],
      communication_style: comprehensive.communication_style || '',
      marketing_suggestions: comprehensive.marketing_suggestions || [],
      quality_score: comprehensive.quality_score || {}
    };
  }

  /**
   * 合并多个数据源
   */
  combineSourceData(sourceData) {
    const combined = {
      records: [],
      raw_text: '',
      metadata: {}
    };

    for (const source of sourceData) {
      if (source.error) continue;

      if (source.data.records) {
        combined.records.push(...source.data.records);
      }
      if (source.data.raw_text) {
        combined.raw_text += source.data.raw_text + '\n';
      }
      combined.metadata[source.name] = source.metadata;
    }

    return combined;
  }

  /**
   * 解析 JSON 响应
   */
  parseJSONResponse(response) {
    if (!response) {
      throw new Error('LLM 返回为空');
    }

    // 尝试提取 JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('无法从响应中解析 JSON');
    }

    try {
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('JSON 解析失败:', error.message);
      console.error('原始响应:', response);
      throw new Error('JSON 解析失败: ' + error.message);
    }
  }

  // 合并方法
  mergeDemographic(detailed, comprehensive) {
    return comprehensive || detailed;
  }

  mergeBehavioral(detailed, comprehensive) {
    return comprehensive || detailed;
  }

  mergePsychological(detailed, comprehensive) {
    return comprehensive || detailed;
  }

  mergeNeeds(detailed, comprehensive) {
    return comprehensive || detailed;
  }

  mergeScenario(detailed, comprehensive) {
    return comprehensive || detailed;
  }

  /**
   * 根据ID获取画像
   */
  async getById(id) {
    return Persona.findByPk(id, {
      include: [
        { model: Project, as: 'project' }
      ]
    });
  }

  /**
   * 获取项目的所有画像
   */
  async getByProject(projectId, options = {}) {
    const { limit = 20, offset = 0, status } = options;

    const where = { project_id: projectId };
    if (status) {
      where.status = status;
    }

    return Persona.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });
  }

  /**
   * 更新画像
   */
  async update(id, data) {
    const persona = await Persona.findByPk(id);
    if (!persona) {
      throw new Error('画像不存在');
    }

    const allowedFields = [
      'name', 'summary', 'demographic', 'behavioral',
      'psychological', 'needs', 'scenario', 'personality_tags',
      'communication_style', 'marketing_suggestions'
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    await persona.update(updateData);
    return persona;
  }

  /**
   * 删除画像
   */
  async delete(id) {
    const persona = await Persona.findByPk(id);
    if (!persona) {
      throw new Error('画像不存在');
    }

    await persona.destroy();
    return { success: true };
  }
}

module.exports = PersonaGenerationService;
