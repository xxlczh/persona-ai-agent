const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Project, User } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// 验证中间件
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '验证失败',
      errors: errors.array()
    });
  }
  next();
};

/**
 * POST /api/projects - 创建项目
 */
router.post('/', authenticate, [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('项目名称长度必须在1-100个字符之间'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('项目描述不能超过2000个字符'),
  body('settings')
    .optional()
    .isObject()
    .withMessage('项目设置必须是对象'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('标签必须是数组')
], validate, async (req, res) => {
  try {
    const { name, description, settings, tags } = req.body;

    // 创建项目
    const project = await Project.create({
      name,
      description,
      owner_id: req.user.id,
      settings: settings || {},
      tags: tags || []
    });

    res.status(201).json({
      success: true,
      message: '项目创建成功',
      data: { project }
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: '创建项目失败，请稍后重试'
    });
  }
});

/**
 * GET /api/projects - 获取项目列表
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {
      owner_id: req.user.id
    };

    // 非管理员只能看到自己的项目
    if (req.user.role !== 'admin') {
      where.status = { [Op.ne]: 'deleted' };
    } else if (status) {
      where.status = status;
    }

    const { count, rows } = await Project.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'owner',
        attributes: ['id', 'username', 'nickname', 'email']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        projects: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: '获取项目列表失败'
    });
  }
});

/**
 * GET /api/projects/:id - 获取项目详情
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'owner',
        attributes: ['id', 'username', 'nickname', 'email']
      }]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    // 检查权限：项目所有者或管理员可以查看
    if (project.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '没有权限查看此项目'
      });
    }

    res.json({
      success: true,
      data: { project }
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: '获取项目详情失败'
    });
  }
});

/**
 * PUT /api/projects/:id - 更新项目
 */
router.put('/:id', authenticate, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('项目名称长度必须在1-100个字符之间'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('项目描述不能超过2000个字符'),
  body('settings')
    .optional()
    .isObject()
    .withMessage('项目设置必须是对象'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('标签必须是数组'),
  body('status')
    .optional()
    .isIn(['active', 'archived'])
    .withMessage('项目状态必须是 active 或 archived')
], validate, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    // 检查权限：只有项目所有者可以更新
    if (project.owner_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '没有权限更新此项目'
      });
    }

    const { name, description, settings, tags, status } = req.body;

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (settings) project.settings = settings;
    if (tags) project.tags = tags;
    if (status) project.status = status;

    await project.save();

    res.json({
      success: true,
      message: '项目更新成功',
      data: { project }
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: '更新项目失败'
    });
  }
});

/**
 * DELETE /api/projects/:id - 删除项目
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    // 检查权限：只有项目所有者或管理员可以删除
    if (project.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '没有权限删除此项目'
      });
    }

    // 软删除
    project.status = 'deleted';
    await project.save();

    res.json({
      success: true,
      message: '项目已删除'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: '删除项目失败'
    });
  }
});

/**
 * POST /api/projects/:id/archive - 归档项目
 */
router.post('/:id/archive', authenticate, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    // 检查权限
    if (project.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '没有权限归档此项目'
      });
    }

    project.status = 'archived';
    await project.save();

    res.json({
      success: true,
      message: '项目已归档',
      data: { project }
    });
  } catch (error) {
    console.error('Archive project error:', error);
    res.status(500).json({
      success: false,
      message: '归档项目失败'
    });
  }
});

module.exports = router;
