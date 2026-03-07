const express = require('express');
const router = express.Router();
const { PromptTemplate, Project, User } = require('../models');
const LLMProvider = require('../services/llm');
const { Op } = require('sequelize');

// ==================== 模板 CRUD 接口 ====================

/**
 * GET /api/prompt-templates
 * 获取模板列表
 */
router.get('/', async (req, res) => {
  try {
    const { projectId, category, isActive, page = 1, pageSize = 20, search } = req.query;

    const where = {};

    // 如果指定了项目ID，则查询该项目下的模板和全局模板
    if (projectId) {
      where[Op.or] = [
        { project_id: projectId },
        { project_id: null }
      ];
    }

    if (category) {
      where.category = category;
    }

    if (isActive !== undefined) {
      where.is_active = isActive === 'true';
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;

    const { count, rows } = await PromptTemplate.findAndCountAll({
      where,
      limit,
      offset,
      order: [['is_default', 'DESC'], ['usage_count', 'DESC'], ['created_at', 'DESC']],
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name'] },
        { model: User, as: 'creator', attributes: ['id', 'username'] }
      ]
    });

    res.json({
      success: true,
      message: '获取成功',
      data: {
        list: rows,
        total: count,
        page: parseInt(page),
        pageSize: limit
      }
    });
  } catch (error) {
    console.error('获取模板列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取模板列表失败',
      error: error.message
    });
  }
});

/**
 * GET /api/prompt-templates/categories
 * 获取模板分类列表
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await PromptTemplate.findAll({
      attributes: ['category'],
      group: ['category'],
      raw: true
    });

    const categoryList = categories.map(c => c.category);

    res.json({
      success: true,
      message: '获取成功',
      data: categoryList
    });
  } catch (error) {
    console.error('获取分类列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取分类列表失败',
      error: error.message
    });
  }
});

/**
 * GET /api/prompt-templates/:id
 * 获取模板详情
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const template = await PromptTemplate.findByPk(id, {
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name'] },
        { model: User, as: 'creator', attributes: ['id', 'username'] }
      ]
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: '模板不存在'
      });
    }

    res.json({
      success: true,
      message: '获取成功',
      data: template
    });
  } catch (error) {
    console.error('获取模板详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取模板详情失败',
      error: error.message
    });
  }
});

/**
 * POST /api/prompt-templates
 * 创建模板
 */
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      template_content,
      variables,
      model_config,
      is_active,
      is_default,
      project_id
    } = req.body;

    if (!name || !template_content) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数：name, template_content'
      });
    }

    // 如果设置为默认模板，则取消其他默认模板
    if (is_default) {
      await PromptTemplate.update(
        { is_default: false },
        { where: { category: category || 'custom' } }
      );
    }

    const template = await PromptTemplate.create({
      name,
      description,
      category: category || 'custom',
      template_content,
      variables: variables || [],
      model_config: model_config || {},
      is_active: is_active !== false,
      is_default: is_default || false,
      project_id: project_id || null,
      created_by: req.body.created_by || null
    });

    res.status(201).json({
      success: true,
      message: '创建成功',
      data: template
    });
  } catch (error) {
    console.error('创建模板失败:', error);
    res.status(500).json({
      success: false,
      message: '创建模板失败',
      error: error.message
    });
  }
});

/**
 * PUT /api/prompt-templates/:id
 * 更新模板
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const template = await PromptTemplate.findByPk(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: '模板不存在'
      });
    }

    // 如果设置为默认模板，则取消其他默认模板
    if (updateData.is_default && !template.is_default) {
      await PromptTemplate.update(
        { is_default: false },
        {
          where: {
            category: template.category,
            id: { [Op.ne]: id }
          }
        }
      );
    }

    // 允许更新的字段
    const allowedFields = [
      'name',
      'description',
      'category',
      'template_content',
      'variables',
      'model_config',
      'is_active',
      'is_default'
    ];

    const filteredData = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    }

    await template.update(filteredData);

    res.json({
      success: true,
      message: '更新成功',
      data: template
    });
  } catch (error) {
    console.error('更新模板失败:', error);
    res.status(500).json({
      success: false,
      message: '更新模板失败',
      error: error.message
    });
  }
});

/**
 * DELETE /api/prompt-templates/:id
 * 删除模板
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const template = await PromptTemplate.findByPk(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: '模板不存在'
      });
    }

    // 不允许删除默认模板
    if (template.is_default) {
      return res.status(400).json({
        success: false,
        message: '默认模板不允许删除'
      });
    }

    await template.destroy();

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除模板失败:', error);
    res.status(500).json({
      success: false,
      message: '删除模板失败',
      error: error.message
    });
  }
});

// ==================== 模板预览接口 ====================

/**
 * POST /api/prompt-templates/:id/preview
 * 预览模板（填充变量后的效果）
 */
router.post('/:id/preview', async (req, res) => {
  try {
    const { id } = req.params;
    const { variables = {} } = req.body;

    const template = await PromptTemplate.findByPk(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: '模板不存在'
      });
    }

    // 替换模板中的变量
    let previewContent = template.template_content;
    const variableValues = {};

    if (template.variables && Array.isArray(template.variables)) {
      for (const variable of template.variables) {
        const value = variables[variable.name] || `[${variable.name}]`;
        previewContent = previewContent.replace(new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g'), value);
        variableValues[variable.name] = value;
      }
    }

    res.json({
      success: true,
      message: '预览成功',
      data: {
        original_content: template.template_content,
        preview_content: previewContent,
        variables: variableValues,
        used_variables: template.variables
      }
    });
  } catch (error) {
    console.error('预览模板失败:', error);
    res.status(500).json({
      success: false,
      message: '预览模板失败',
      error: error.message
    });
  }
});

// ==================== 模板测试接口 ====================

/**
 * POST /api/prompt-templates/:id/test
 * 测试模板（实际调用LLM）
 */
router.post('/:id/test', async (req, res) => {
  try {
    const { id } = req.params;
    const { variables = {}, model, model_config } = req.body;

    const template = await PromptTemplate.findByPk(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: '模板不存在'
      });
    }

    // 替换模板中的变量
    let promptContent = template.template_content;

    if (template.variables && Array.isArray(template.variables)) {
      for (const variable of template.variables) {
        const value = variables[variable.name] || '';
        promptContent = promptContent.replace(new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g'), value);
      }
    }

    // 合并配置
    const config = {
      ...template.model_config,
      ...model_config
    };

    // 调用LLM
    const llmProvider = new LLMProvider(model);
    const startTime = Date.now();

    const result = await llmProvider.generate(promptContent, config);

    const endTime = Date.now();

    // 更新使用统计
    await template.update({
      usage_count: template.usage_count + 1,
      last_used_at: new Date()
    });

    res.json({
      success: true,
      message: '测试成功',
      data: {
        prompt: promptContent,
        result,
        config: {
          model: model || 'default',
          ...config
        },
        time_used: endTime - startTime
      }
    });
  } catch (error) {
    console.error('测试模板失败:', error);
    res.status(500).json({
      success: false,
      message: '测试模板失败',
      error: error.message
    });
  }
});

/**
 * POST /api/prompt-templates/test-simple
 * 简单测试（不保存模板，直接测试）
 */
router.post('/test-simple', async (req, res) => {
  try {
    const { prompt, model, model_config } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: '缺少 prompt 参数'
      });
    }

    // 调用LLM
    const llmProvider = new LLMProvider(model);
    const startTime = Date.now();

    const result = await llmProvider.generate(prompt, model_config || {});

    const endTime = Date.now();

    res.json({
      success: true,
      message: '测试成功',
      data: {
        prompt,
        result,
        config: {
          model: model || 'default',
          ...(model_config || {})
        },
        time_used: endTime - startTime
      }
    });
  } catch (error) {
    console.error('测试失败:', error);
    res.status(500).json({
      success: false,
      message: '测试失败',
      error: error.message
    });
  }
});

// ==================== 模板复制接口 ====================

/**
 * POST /api/prompt-templates/:id/duplicate
 * 复制模板
 */
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, project_id } = req.body;

    const template = await PromptTemplate.findByPk(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: '模板不存在'
      });
    }

    const newTemplate = await PromptTemplate.create({
      name: name || `${template.name} (复制)`,
      description: template.description,
      category: template.category,
      template_content: template.template_content,
      variables: template.variables,
      model_config: template.model_config,
      is_active: template.is_active,
      is_default: false,
      project_id: project_id || template.project_id,
      created_by: req.body.created_by || template.created_by
    });

    res.status(201).json({
      success: true,
      message: '复制成功',
      data: newTemplate
    });
  } catch (error) {
    console.error('复制模板失败:', error);
    res.status(500).json({
      success: false,
      message: '复制模板失败',
      error: error.message
    });
  }
});

// ==================== 默认模板接口 ====================

/**
 * GET /api/prompt-templates/defaults/list
 * 获取系统默认模板列表
 */
router.get('/defaults/list', async (req, res) => {
  try {
    const templates = await PromptTemplate.findAll({
      where: { is_default: true },
      order: [['category', 'ASC'], ['name', 'ASC']],
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name'] },
        { model: User, as: 'creator', attributes: ['id', 'username'] }
      ]
    });

    res.json({
      success: true,
      message: '获取成功',
      data: templates
    });
  } catch (error) {
    console.error('获取默认模板列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取默认模板列表失败',
      error: error.message
    });
  }
});

/**
 * POST /api/prompt-templates/:id/set-default
 * 设置为默认模板
 */
router.post('/:id/set-default', async (req, res) => {
  try {
    const { id } = req.params;

    const template = await PromptTemplate.findByPk(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: '模板不存在'
      });
    }

    // 取消同分类的其他默认模板
    await PromptTemplate.update(
      { is_default: false },
      {
        where: {
          category: template.category,
          id: { [Op.ne]: id }
        }
      }
    );

    // 设置当前模板为默认
    await template.update({ is_default: true });

    res.json({
      success: true,
      message: '设置成功',
      data: template
    });
  } catch (error) {
    console.error('设置默认模板失败:', error);
    res.status(500).json({
      success: false,
      message: '设置默认模板失败',
      error: error.message
    });
  }
});

module.exports = router;
