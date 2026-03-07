const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * JWT 认证中间件
 * 验证请求头中的 JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 从数据库获取用户信息，确保用户仍然存在且状态正常
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: '用户不存在或已被删除'
        });
      }

      if (user.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: '用户账户已被禁用'
        });
      }

      // 将用户信息挂载到请求对象
      req.user = user;
      req.userId = user.id;
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: '令牌已过期'
        });
      }
      return res.status(401).json({
        success: false,
        message: '无效的令牌'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: '认证过程出错'
    });
  }
};

/**
 * 可选的认证中间件
 * 如果存在 token 则验证，不存在则继续
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });

      if (user && user.status === 'active') {
        req.user = user;
        req.userId = user.id;
      }
    } catch (jwtError) {
      // token 无效，忽略继续
    }

    next();
  } catch (error) {
    next();
  }
};

/**
 * 管理员权限验证中间件
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '需要登录'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: '需要管理员权限'
    });
  }

  next();
};

/**
 * 生成 JWT token
 */
const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

module.exports = {
  authenticate,
  optionalAuth,
  requireAdmin,
  generateToken
};
