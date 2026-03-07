const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const { DataSource, Project } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/datasources');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.csv', '.json', '.txt', '.xlsx', '.xml'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型，仅支持 csv, json, txt, xlsx, xml'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

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
 * POST /api/datasources - 上传数据源文件
 */
router.post('/', authenticate, upload.single('file'), [
  body('project_id')
    .isInt({ min: 1 })
    .withMessage('项目ID必须是正整数'),
  body('name')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('数据源名称不能超过255个字符')
], validate, async (req, res) => {
  try {
    const { project_id, name } = req.body;

    // 检查项目是否存在
    const project = await Project.findByPk(project_id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    // 检查权限：项目所有者可以上传
    if (project.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '没有权限在此项目中上传数据源'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传文件'
      });
    }

    // 获取文件类型
    const ext = path.extname(req.file.originalname).toLowerCase().slice(1);
    const typeMap = {
      csv: 'csv',
      json: 'json',
      txt: 'txt',
      xlsx: 'xlsx',
      xml: 'xml'
    };

    // 创建数据源记录
    const dataSource = await DataSource.create({
      project_id: parseInt(project_id),
      name: name || req.file.originalname,
      type: typeMap[ext] || 'txt',
      file_path: req.file.path,
      original_name: req.file.originalname,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      status: 'pending',
      metadata: {}
    });

    res.status(201).json({
      success: true,
      message: '数据源上传成功',
      data: { dataSource }
    });
  } catch (error) {
    console.error('Upload data source error:', error);
    res.status(500).json({
      success: false,
      message: '上传数据源失败，请稍后重试'
    });
  }
});

/**
 * GET /api/datasources - 获取数据源列表
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { project_id, page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    // 如果指定了项目ID，先验证项目
    if (project_id) {
      const project = await Project.findByPk(project_id);
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
          message: '没有权限查看此项目的数据源'
        });
      }
    }

    const where = {};
    if (project_id) {
      where.project_id = parseInt(project_id);
    }
    if (status) {
      where.status = status;
    }

    // 非管理员只能看到自己项目的数据源
    if (req.user.role !== 'admin') {
      const userProjects = await Project.findAll({
        where: { owner_id: req.user.id },
        attributes: ['id']
      });
      const projectIds = userProjects.map(p => p.id);

      if (project_id) {
        if (!projectIds.includes(parseInt(project_id))) {
          return res.status(403).json({
            success: false,
            message: '没有权限查看此项目的数据源'
          });
        }
      } else {
        where.project_id = { [require('sequelize').Op.in]: projectIds };
      }
    }

    const { count, rows } = await DataSource.findAndCountAll({
      where,
      include: [{
        model: Project,
        as: 'project',
        attributes: ['id', 'name', 'owner_id']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        dataSources: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get data sources error:', error);
    res.status(500).json({
      success: false,
      message: '获取数据源列表失败'
    });
  }
});

/**
 * GET /api/datasources/:id - 获取数据源详情
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const dataSource = await DataSource.findByPk(req.params.id, {
      include: [{
        model: Project,
        as: 'project',
        attributes: ['id', 'name', 'owner_id', 'description']
      }]
    });

    if (!dataSource) {
      return res.status(404).json({
        success: false,
        message: '数据源不存在'
      });
    }

    // 检查权限
    const project = await Project.findByPk(dataSource.project_id);
    if (project.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '没有权限查看此数据源'
      });
    }

    res.json({
      success: true,
      data: { dataSource }
    });
  } catch (error) {
    console.error('Get data source error:', error);
    res.status(500).json({
      success: false,
      message: '获取数据源详情失败'
    });
  }
});

/**
 * DELETE /api/datasources/:id - 删除数据源
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const dataSource = await DataSource.findByPk(req.params.id);

    if (!dataSource) {
      return res.status(404).json({
        success: false,
        message: '数据源不存在'
      });
    }

    // 检查权限
    const project = await Project.findByPk(dataSource.project_id);
    if (project.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '没有权限删除此数据源'
      });
    }

    // 删除物理文件
    if (dataSource.file_path && fs.existsSync(dataSource.file_path)) {
      fs.unlinkSync(dataSource.file_path);
    }

    // 删除数据库记录
    await dataSource.destroy();

    res.json({
      success: true,
      message: '数据源已删除'
    });
  } catch (error) {
    console.error('Delete data source error:', error);
    res.status(500).json({
      success: false,
      message: '删除数据源失败'
    });
  }
});

/**
 * PUT /api/datasources/:id - 更新数据源信息
 */
router.put('/:id', authenticate, [
  body('name')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('数据源名称不能超过255个字符'),
  body('status')
    .optional()
    .isIn(['pending', 'processing', 'completed', 'failed'])
    .withMessage('状态必须是 pending, processing, completed 或 failed')
], validate, async (req, res) => {
  try {
    const dataSource = await DataSource.findByPk(req.params.id);

    if (!dataSource) {
      return res.status(404).json({
        success: false,
        message: '数据源不存在'
      });
    }

    // 检查权限
    const project = await Project.findByPk(dataSource.project_id);
    if (project.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '没有权限更新此数据源'
      });
    }

    const { name, status, metadata, error_message } = req.body;

    if (name) dataSource.name = name;
    if (status) dataSource.status = status;
    if (metadata) dataSource.metadata = metadata;
    if (error_message !== undefined) dataSource.error_message = error_message;

    await dataSource.save();

    res.json({
      success: true,
      message: '数据源更新成功',
      data: { dataSource }
    });
  } catch (error) {
    console.error('Update data source error:', error);
    res.status(500).json({
      success: false,
      message: '更新数据源失败'
    });
  }
});

module.exports = router;
