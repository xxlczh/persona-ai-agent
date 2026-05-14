/**
 * 用户画像生成服务
 * 负责从数据源生成用户画像的完整流程
 */

const { Persona, DataSource, Project, Evaluation } = require('../models');
const llmManager = require('../services/llm');
const PersonaPrompts = require('../prompts/PersonaPrompts');
const PersonaQualityEvaluator = require('./PersonaQualityEvaluator');
const fs = require('fs').promises;
const path = require('path');

class PersonaGenerationService {
  constructor(options = {}) {
    this.options = options;
    this.llmProvider = null;
    this.modelType = options.modelType || 'deepseek';
  }

  /**
   * 初始化 LLM 提供者
   */
  async initLLM(modelType = 'deepseek') {
    this.modelType = modelType;

    if (modelType && llmManager.providers[modelType]) {
      llmManager.switchProvider(modelType);
    }

    this.llmProvider = llmManager.currentProvider;
    return this.llmProvider;
  }

  /**
   * 生成用户画像主流程
   */
  async generate(projectId, sourceDataIds, config = {}) {
    const startTime = Date.now();

    const sourceData = await this.fetchSourceData(sourceDataIds);

    const persona = await Persona.create({
      project_id: projectId,
      name: '生成中...',
      status: 'generating',
      source_data_ids: sourceDataIds,
      generation_config: config
    });

    try {
      let result;
      if (config.mode === 'quick') {
        result = await this.generateQuick(sourceData, config);
      } else {
        result = await this.generateComprehensive(sourceData, config);
      }

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
      await persona.update({
        status: 'failed',
        error_message: error.message
      });
      throw error;
    }
  }

  /**
   * 获取数据源数据
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
   * 解析 CSV 行
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
   */
  async generateQuick(sourceData, config) {
    await this.initLLM(config.modelType || 'deepseek');

    const combinedData = this.combineSourceData(sourceData);
    const prompt = PersonaPrompts.getQuickPrompt(combinedData);

    const response = await this.llmProvider.chat([prompt], {
      temperature: config.temperature || 0.7,
      max_tokens: config.max_tokens || 2000
    });

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
   */
  async generateComprehensive(sourceData, config) {
    await this.initLLM(config.modelType || 'deepseek');

    const combinedData = this.combineSourceData(sourceData);

    const llmOptions = {
      temperature: config.temperature || 0.7,
      max_tokens: config.max_tokens || 1500
    };

    const demographicPrompt = PersonaPrompts.getDemographicPrompt(combinedData);
    const behavioralPrompt = PersonaPrompts.getBehavioralPrompt(combinedData);
    const psychologicalPrompt = PersonaPrompts.getPsychologicalPrompt(combinedData);
    const needsPrompt = PersonaPrompts.getNeedsPrompt(combinedData);
    const scenarioPrompt = PersonaPrompts.getScenarioPrompt(combinedData);

    const [demographicResponse, behavioralResponse, psychologicalResponse, needsResponse, scenarioResponse] = await Promise.all([
      this.llmProvider.chat([demographicPrompt], llmOptions),
      this.llmProvider.chat([behavioralPrompt], llmOptions),
      this.llmProvider.chat([psychologicalPrompt], llmOptions),
      this.llmProvider.chat([needsPrompt], llmOptions),
      this.llmProvider.chat([scenarioPrompt], llmOptions)
    ]);

    const demographic = this.parseJSONResponse(demographicResponse);
    const behavioral = this.parseJSONResponse(behavioralResponse);
    const psychological = this.parseJSONResponse(psychologicalResponse);
    const needs = this.parseJSONResponse(needsResponse);
    const scenario = this.parseJSONResponse(scenarioResponse);

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

    let cleanedResponse = response
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .replace(/^\s*/, '')
      .replace(/\s*$/, '');

    let jsonStr = null;

    const lastBraceMatch = cleanedResponse.match(/\{[\s\S]*\}$/);
    if (lastBraceMatch) {
      jsonStr = lastBraceMatch[0];
    }

    if (!jsonStr) {
      const firstBrace = cleanedResponse.indexOf('{');
      const lastBrace = cleanedResponse.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = cleanedResponse.substring(firstBrace, lastBrace + 1);
      }
    }

    if (!jsonStr) {
      throw new Error('无法从响应中解析 JSON');
    }

    jsonStr = jsonStr.replace(/"/g, '"').replace(/"/g, '"');
    jsonStr = jsonStr.replace(/'/g, '\'').replace(/'/g, '\'');
    jsonStr = jsonStr.replace(/[\x00-\x1F\x7F]/g, '');
    jsonStr = jsonStr.trim();

    try {
      return JSON.parse(jsonStr);
    } catch (error) {
      // 尝试修复常见问题
      // 1. 移除尾随逗号
      jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
      // 2. 替换中文标点符号（在引号外面的）
      jsonStr = jsonStr.replace(/，(\s*[}":])/g, ',$1');
      jsonStr = jsonStr.replace(/。(\s*[}":])/g, '.$1');
      // 3. 移除多余空白
      jsonStr = jsonStr.replace(/\s+/g, ' ').trim();

      try {
        return JSON.parse(jsonStr);
      } catch (error2) {
        // 最后尝试：只提取有效的JSON部分
        console.error('JSON解析再次失败，尝试提取有效部分');
        const validJson = this.extractValidJson(jsonStr);
        if (validJson) {
          return validJson;
        }
        throw new Error('JSON 解析失败: ' + error2.message);
      }
    }
  }

  /**
   * 尝试从损坏的JSON中提取有效部分
   */
  extractValidJson(str) {
    try {
      // 尝试找到完整的JSON对象
      let start = str.indexOf('{');
      let depth = 0;
      let end = -1;

      for (let i = start; i < str.length; i++) {
        if (str[i] === '{') depth++;
        else if (str[i] === '}') {
          depth--;
          if (depth === 0) {
            end = i;
            break;
          }
        }
      }

      if (end > start) {
        const jsonPart = str.substring(start, end + 1);
        return JSON.parse(jsonPart);
      }
    } catch (e) {
      console.error('提取有效JSON失败:', e.message);
    }
    return null;
  }

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

  /**
   * 通过自然语言生成用户画像（极简模式）
   */
  async generateFromNaturalLanguage(projectId, naturalLanguageInput, config = {}) {
    const startTime = Date.now();

    const persona = await Persona.create({
      project_id: projectId,
      name: '生成中...',
      status: 'generating',
      generation_config: config
    });

    try {
      await this.initLLM(config.modelType || 'deepseek');

      const prompt = PersonaPrompts.getNaturalLanguagePrompt(naturalLanguageInput, config);

      const response = await this.llmProvider.chat([prompt], {
        temperature: config.temperature || 0.7,
        max_tokens: config.max_tokens || 2000
      });

      console.log('LLM原始响应:', response.substring(0, 300));

      const result = this.parseJSONResponse(response);

      await persona.update({
        name: result.persona_name || '自然语言画像',
        summary: result.summary,
        demographic: result.demographic || {},
        behavioral: result.behavioral || {},
        psychological: result.psychological || {},
        needs: result.needs || {},
        scenario: result.scenario || {},
        personality_tags: result.tags || [],
        communication_style: result.communication_style || '',
        marketing_suggestions: result.marketing_suggestions || [],
        quality_score: result.quality_score || {
          completeness: 0.7,
          consistency: 0.7,
          overall: 0.7
        },
        status: 'completed',
        generated_by: config.modelType || 'auto'
      });

      const duration = Date.now() - startTime;
      console.log(`自然语言画像生成完成，耗时: ${duration}ms`);

      // 自动评估画像质量
      await this.autoEvaluate(persona);

      return persona;

    } catch (error) {
      await persona.update({
        status: 'failed',
        error_message: error.message
      });
      throw error;
    }
  }
  /**
   * 自动评估画像质量
   */
  async autoEvaluate(persona) {
    try {
      const evaluator = new PersonaQualityEvaluator();
      const evaluationResult = await evaluator.evaluate(persona.toJSON ? persona.toJSON() : persona);

      await persona.update({
        quality_score: {
          overall_score: evaluationResult.overall_score,
          overall_level: evaluationResult.overall_level,
          completeness: evaluationResult.dimensions.completeness.score,
          consistency: evaluationResult.dimensions.consistency.score,
          authenticity: evaluationResult.dimensions.authenticity.score,
          actionability: evaluationResult.dimensions.actionability.score,
          last_evaluated_at: new Date().toISOString()
        }
      });

      console.log(`画像 ${persona.id} 自动评估完成，综合评分: ${evaluationResult.overall_score}`);
      return evaluationResult;
    } catch (error) {
      console.error(`画像 ${persona.id} 自动评估失败:`, error.message);
      return null;
    }
  }
}

module.exports = PersonaGenerationService;
