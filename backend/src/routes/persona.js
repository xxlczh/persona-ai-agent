const express = require('express');
const router = express.Router();
const { Persona, Project } = require('../models');
const PersonaGenerationService = require('../services/PersonaGenerationService');
const cacheService = require('../services/CacheService');

/**
 * POST /api/persona/generate
 * 生成用户画像
 */
router.post('/generate', async (req, res) => {
  try {
    const { projectId, sourceDataIds, config } = req.body;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: '缺少 projectId 参数'
      });
    }

    if (!sourceDataIds || !Array.isArray(sourceDataIds) || sourceDataIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '缺少 sourceDataIds 参数或格式错误'
      });
    }

    // 验证项目是否存在
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    // 生成画像
    const personaService = new PersonaGenerationService();
    const persona = await personaService.generate(projectId, sourceDataIds, config || {});

    res.status(201).json({
      success: true,
      message: '画像生成成功',
      data: persona
    });
  } catch (error) {
    console.error('生成画像失败:', error);
    res.status(500).json({
      success: false,
      message: '生成画像失败',
      error: error.message
    });
  }
});

/**
 * GET /api/persona/list
 * 获取画像列表
 */
router.get('/list', async (req, res) => {
  try {
    const { projectId, status, page = 1, pageSize = 20 } = req.query;

    // 生成缓存键
    const cacheKey = cacheService.generateListCacheKey({ projectId, status, page, pageSize });

    // 尝试从缓存获取
    const cachedData = await cacheService.getPersonaList(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        message: '获取成功(缓存)',
        data: cachedData,
        cached: true
      });
    }

    const where = {};
    if (projectId) {
      where.project_id = projectId;
    }
    if (status) {
      where.status = status;
    }

    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;

    const { count, rows } = await Persona.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name'] }
      ]
    });

    const result = {
      list: rows,
      total: count,
      page: parseInt(page),
      pageSize: limit
    };

    // 缓存结果
    await cacheService.setPersonaList(cacheKey, result);

    res.json({
      success: true,
      message: '获取成功',
      data: result,
      cached: false
    });
  } catch (error) {
    console.error('获取画像列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取画像列表失败',
      error: error.message
    });
  }
});

/**
 * GET /api/persona/:id
 * 获取画像详情
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 尝试从缓存获取
    const cachedPersona = await cacheService.getPersona(id);
    if (cachedPersona) {
      return res.json({
        success: true,
        message: '获取成功(缓存)',
        data: cachedPersona,
        cached: true
      });
    }

    const persona = await Persona.findByPk(id, {
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name', 'description'] }
      ]
    });

    if (!persona) {
      return res.status(404).json({
        success: false,
        message: '画像不存在'
      });
    }

    // 缓存结果
    await cacheService.setPersona(id, persona);

    res.json({
      success: true,
      message: '获取成功',
      data: persona,
      cached: false
    });
  } catch (error) {
    console.error('获取画像详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取画像详情失败',
      error: error.message
    });
  }
});

/**
 * PUT /api/persona/:id
 * 更新画像
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const persona = await Persona.findByPk(id);

    if (!persona) {
      return res.status(404).json({
        success: false,
        message: '画像不存在'
      });
    }

    // 允许更新的字段
    const allowedFields = [
      'name',
      'summary',
      'demographic',
      'behavioral',
      'psychological',
      'needs',
      'scenario',
      'personality_tags',
      'communication_style',
      'marketing_suggestions'
    ];

    const filteredData = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    }

    await persona.update(filteredData);

    // 清除缓存
    await cacheService.delPersona(id);
    await cacheService.clearPersonaCache();

    res.json({
      success: true,
      message: '更新成功',
      data: persona
    });
  } catch (error) {
    console.error('更新画像失败:', error);
    res.status(500).json({
      success: false,
      message: '更新画像失败',
      error: error.message
    });
  }
});

/**
 * DELETE /api/persona/:id
 * 删除画像
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const persona = await Persona.findByPk(id);

    if (!persona) {
      return res.status(404).json({
        success: false,
        message: '画像不存在'
      });
    }

    await persona.destroy();

    // 清除缓存
    await cacheService.delPersona(id);
    await cacheService.clearPersonaCache();

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除画像失败:', error);
    res.status(500).json({
      success: false,
      message: '删除画像失败',
      error: error.message
    });
  }
});

module.exports = router;
