const express = require('express');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { authenticate, generateToken } = require('../middleware/auth');

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
 * POST /api/users/register - 用户注册
 */
router.post('/register', [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('用户名长度必须在3-50个字符之间')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('请提供有效的邮箱地址')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6, max: 100 })
    .withMessage('密码长度必须在6-100个字符之间'),
  body('nickname')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('昵称长度不能超过50个字符')
], validate, async (req, res) => {
  try {
    const { username, email, password, nickname } = req.body;

    // 检查用户名是否已存在
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: '用户名已被使用'
      });
    }

    // 检查邮箱是否已存在
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: '邮箱已被注册'
      });
    }

    // 创建用户
    const user = await User.create({
      username,
      email,
      password,
      nickname: nickname || username
    });

    // 生成 token
    const token = generateToken(user);

    // 返回用户信息（不包含密码）
    const userData = user.toJSON();
    delete userData.password;

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: userData,
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: '注册失败，请稍后重试'
    });
  }
});

/**
 * POST /api/users/login - 用户登录
 */
router.post('/login', [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('用户名或邮箱不能为空'),
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
], validate, async (req, res) => {
  try {
    const { username, password } = req.body;

    // 查找用户
    const user = await User.findByUsernameOrEmail(username);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名/邮箱或密码错误'
      });
    }

    // 检查用户状态
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: '账户已被禁用，请联系管理员'
      });
    }

    // 验证密码
    const isValidPassword = await user.validatePassword(password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '用户名/邮箱或密码错误'
      });
    }

    // 更新最后登录信息
    user.last_login_at = new Date();
    user.last_login_ip = req.ip || req.connection.remoteAddress;
    await user.save();

    // 生成 token
    const token = generateToken(user);

    // 返回用户信息（不包含密码）
    const userData = user.toJSON();
    delete userData.password;

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: userData,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试'
    });
  }
});

/**
 * GET /api/users/me - 获取当前用户信息
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
});

/**
 * PUT /api/users/me - 更新当前用户信息
 */
router.put('/me', authenticate, [
  body('nickname')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('昵称长度不能超过50个字符'),
  body('avatar')
    .optional()
    .trim()
    .isURL()
    .withMessage('头像必须是有效的URL')
], validate, async (req, res) => {
  try {
    const { nickname, avatar } = req.body;
    const user = req.user;

    // 更新用户信息
    if (nickname) user.nickname = nickname;
    if (avatar) user.avatar = avatar;

    await user.save();

    const userData = user.toJSON();
    delete userData.password;

    res.json({
      success: true,
      message: '更新成功',
      data: {
        user: userData
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: '更新用户信息失败'
    });
  }
});

/**
 * PUT /api/users/me/password - 修改密码
 */
router.put('/me/password', authenticate, [
  body('oldPassword')
    .notEmpty()
    .withMessage('旧密码不能为空'),
  body('newPassword')
    .isLength({ min: 6, max: 100 })
    .withMessage('新密码长度必须在6-100个字符之间')
], validate, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = req.user;

    // 验证旧密码
    const isValidPassword = await user.validatePassword(oldPassword);

    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: '旧密码错误'
      });
    }

    // 更新密码
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: '密码修改成功，请重新登录'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: '修改密码失败'
    });
  }
});

// 管理员接口

/**
 * GET /api/users - 获取所有用户（管理员）
 */
router.get('/', authenticate, async (req, res) => {
  try {
    // 检查是否是管理员
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '需要管理员权限'
      });
    }

    const { page = 1, limit = 10, status, role } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (role) where.role = role;

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        users: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败'
    });
  }
});

/**
 * GET /api/users/:id - 获取指定用户（管理员）
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '需要管理员权限'
      });
    }

    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
});

/**
 * PUT /api/users/:id - 更新指定用户（管理员）
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '需要管理员权限'
      });
    }

    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const { nickname, avatar, role, status } = req.body;

    if (nickname) user.nickname = nickname;
    if (avatar) user.avatar = avatar;
    if (role && ['user', 'admin'].includes(role)) user.role = role;
    if (status && ['active', 'inactive', 'banned'].includes(status)) user.status = status;

    await user.save();

    const userData = user.toJSON();
    delete userData.password;

    res.json({
      success: true,
      message: '更新成功',
      data: { user: userData }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: '更新用户失败'
    });
  }
});

/**
 * DELETE /api/users/:id - 删除用户（管理员）
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '需要管理员权限'
      });
    }

    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    await user.destroy();

    res.json({
      success: true,
      message: '用户已删除'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: '删除用户失败'
    });
  }
});

module.exports = router;
