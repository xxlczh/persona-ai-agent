const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Project, User, ProjectMember, Team, TeamMember } = require('../models');
const { authenticate } = require('../middleware/auth');
const crypto = require('crypto');

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

    // 创建项目时生成邀请码
    const inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();

    const project = await Project.create({
      name,
      description,
      owner_id: req.user.id,
      owner_name: req.user.username,
      invite_code: inviteCode,
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
    const { page = 1, limit = 10, status, filter } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;

    // 获取我创建的项目
    const myProjectIds = await Project.findAll({
      where: {
        owner_id: userId,
        ...(status ? { status } : { status: { [Op.ne]: 'deleted' } })
      },
      attributes: ['id']
    });
    const myIds = myProjectIds.map(p => p.id);

    // 获取我加入的项目
    const joinedRecords = await ProjectMember.findAll({
      where: { user_id: userId },
      attributes: ['project_id']
    });
    const joinedIds = joinedRecords.map(r => r.project_id);

    let projects = [];
    let total = 0;

    if (filter === 'joined') {
      // 只看加入的项目
      if (joinedIds.length > 0) {
        const { count, rows } = await Project.findAndCountAll({
          where: {
            id: joinedIds,
            ...(status ? { status } : { status: { [Op.ne]: 'deleted' } })
          },
          include: [{
            model: User,
            as: 'owner',
            attributes: ['id', 'username', 'nickname', 'email']
          }],
          limit: parseInt(limit),
          offset: parseInt(offset),
          order: [['created_at', 'DESC']]
        });
        projects = rows.map(p => ({ ...p.toJSON(), is_joined: true }));
        total = count;
      }
    } else {
      // 看全部（或我创建的）
      const allIds = filter === 'my' ? myIds : [...new Set([...myIds, ...joinedIds])];

      if (allIds.length > 0) {
        const { count, rows } = await Project.findAndCountAll({
          where: {
            id: allIds,
            ...(status ? { status } : { status: { [Op.ne]: 'deleted' } })
          },
          include: [{
            model: User,
            as: 'owner',
            attributes: ['id', 'username', 'nickname', 'email']
          }],
          limit: parseInt(limit),
          offset: parseInt(offset),
          order: [['created_at', 'DESC']]
        });
        projects = rows.map(p => ({
          ...p.toJSON(),
          is_joined: joinedIds.includes(p.id) && p.owner_id !== userId
        }));
        total = count;
      } else {
        projects = [];
        total = 0;
      }
    }

    res.json({
      success: true,
      data: {
        projects,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
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

/**
 * POST /api/projects/join - 通过邀请码加入项目
 */
router.post('/join', authenticate, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user.id;

    if (!inviteCode) {
      return res.status(400).json({
        success: false,
        message: '请输入邀请码'
      });
    }

    const project = await Project.findOne({
      where: { invite_code: inviteCode }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '邀请码无效'
      });
    }

    // 不能加入自己的项目
    if (project.owner_id === userId) {
      return res.status(400).json({
        success: false,
        message: '不能加入自己的项目'
      });
    }

    // 检查是否已经加入
    const existing = await ProjectMember.findOne({
      where: { project_id: project.id, user_id: userId }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: '您已加入该项目'
      });
    }

    // 添加项目成员
    await ProjectMember.create({
      project_id: project.id,
      user_id: userId
    });

    // 如果该项目已有团队，自动将用户加入团队
    const team = await Team.findOne({
      where: { project_id: project.id }
    });

    if (team) {
      // 检查是否已是团队成员
      const existingMember = await TeamMember.findOne({
        where: { team_id: team.id, user_id: userId }
      });

      if (!existingMember) {
        await TeamMember.create({
          team_id: team.id,
          user_id: userId,
          role: 'member'
        });
      }
    }

    res.json({
      success: true,
      message: '成功加入项目',
      data: { project }
    });
  } catch (error) {
    console.error('Join project error:', error);
    res.status(500).json({
      success: false,
      message: '加入项目失败'
    });
  }
});

/**
 * GET /api/projects/:id/invite-code - 获取项目邀请码
 */
router.get('/:id/invite-code', authenticate, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    // 只有项目所有者可以查看邀请码
    if (project.owner_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '只有项目所有者可以查看邀请码'
      });
    }

    res.json({
      success: true,
      data: {
        invite_code: project.invite_code
      }
    });
  } catch (error) {
    console.error('Get invite code error:', error);
    res.status(500).json({
      success: false,
      message: '获取邀请码失败'
    });
  }
});

/**
 * DELETE /api/projects/:id/leave - 退出项目
 */
router.delete('/:id/leave', authenticate, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    // 不能退出自己的项目
    if (project.owner_id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: '不能退出自己的项目，请使用删除功能'
      });
    }

    const member = await ProjectMember.findOne({
      where: { project_id: project.id, user_id: req.user.id }
    });

    if (!member) {
      return res.status(400).json({
        success: false,
        message: '您不是该项目成员'
      });
    }

    await member.destroy();

    res.json({
      success: true,
      message: '已退出项目'
    });
  } catch (error) {
    console.error('Leave project error:', error);
    res.status(500).json({
      success: false,
      message: '退出项目失败'
    });
  }
});

module.exports = router;
