const express = require('express');
const { body, validationResult } = require('express-validator');
const { Share, User, Persona, Survey, MarketingScript, ProductSuggestion } = require('../models');
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
 * POST /api/shares - 分享内容到作品广场
 */
router.post('/', authenticate, [
  body('resource_type')
    .isIn(['persona', 'survey', 'script', 'suggestion'])
    .withMessage('资源类型必须是 persona、survey、script 或 suggestion'),
  body('resource_id')
    .isInt({ min: 1 })
    .withMessage('资源ID必须是正整数')
], validate, async (req, res) => {
  try {
    const { resource_type, resource_id } = req.body;
    const userId = req.user.id;

    // 检查资源是否存在
    const resourceExists = await checkResourceExists(resource_type, resource_id);
    if (!resourceExists) {
      return res.status(404).json({
        success: false,
        message: '资源不存在'
      });
    }

    // 检查是否已经分享过
    const existing = await Share.findOne({
      where: {
        user_id: userId,
        resource_type,
        resource_id,
        status: 'shared'
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: '已经分享过该内容'
      });
    }

    // 创建分享记录
    const share = await Share.create({
      user_id: userId,
      resource_type,
      resource_id,
      status: 'shared'
    });

    res.status(201).json({
      success: true,
      message: '分享成功',
      data: { share }
    });
  } catch (error) {
    console.error('Share error:', error);
    res.status(500).json({
      success: false,
      message: '分享失败'
    });
  }
});

/**
 * DELETE /api/shares/:type/:id - 取消分享
 */
router.delete('/:type/:id', authenticate, async (req, res) => {
  try {
    const { type, id } = req.params;
    const userId = req.user.id;

    if (!['persona', 'survey', 'script', 'suggestion'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: '无效的资源类型'
      });
    }

    const share = await Share.findOne({
      where: {
        user_id: userId,
        resource_type: type,
        resource_id: parseInt(id)
      }
    });

    if (!share) {
      return res.status(404).json({
        success: false,
        message: '分享记录不存在'
      });
    }

    await share.destroy();

    res.json({
      success: true,
      message: '已取消分享'
    });
  } catch (error) {
    console.error('Unshare error:', error);
    res.status(500).json({
      success: false,
      message: '取消分享失败'
    });
  }
});

/**
 * GET /api/shares/my - 获取我分享的内容
 */
router.get('/my', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const shares = await Share.findAll({
      where: {
        user_id: userId,
        status: 'shared'
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'nickname', 'avatar']
      }],
      order: [['created_at', 'DESC']]
    });

    // 获取每个分享的详细内容
    const items = await Promise.all(shares.map(async (share) => {
      const resource = await getResourceDetail(share.resource_type, share.resource_id);
      return {
        id: share.id,
        type: share.resource_type,
        resource_id: share.resource_id,
        creator: share.user,
        created_at: share.created_at,
        ...resource
      };
    }));

    res.json({
      success: true,
      data: { items }
    });
  } catch (error) {
    console.error('Get my shares error:', error);
    res.status(500).json({
      success: false,
      message: '获取分享列表失败'
    });
  }
});

/**
 * GET /api/shares/check/:type/:id - 检查是否已分享
 */
router.get('/check/:type/:id', authenticate, async (req, res) => {
  try {
    const { type, id } = req.params;
    const userId = req.user.id;

    const share = await Share.findOne({
      where: {
        user_id: userId,
        resource_type: type,
        resource_id: parseInt(id),
        status: 'shared'
      }
    });

    res.json({
      success: true,
      data: { shared: !!share }
    });
  } catch (error) {
    console.error('Check share error:', error);
    res.status(500).json({
      success: false,
      message: '检查分享状态失败'
    });
  }
});

// 辅助函数：检查资源是否存在
async function checkResourceExists(type, id) {
  switch (type) {
    case 'persona':
      const persona = await Persona.findByPk(id);
      return !!persona;
    case 'survey':
      const survey = await Survey.findByPk(id);
      return !!survey;
    case 'script':
      const script = await MarketingScript.findByPk(id);
      return !!script;
    case 'suggestion':
      const suggestion = await ProductSuggestion.findByPk(id);
      return !!suggestion;
    default:
      return false;
  }
}

// 辅助函数：获取资源详细信息
async function getResourceDetail(type, id) {
  switch (type) {
    case 'persona':
      const persona = await Persona.findByPk(id, {
        attributes: ['id', 'name', 'summary', 'quality_score', 'personality_tags', 'created_at']
      });
      if (!persona) return { name: '已删除的画像', summary: '' };
      return {
        name: persona.name,
        summary: persona.summary,
        quality_score: persona.quality_score,
        personality_tags: persona.personality_tags,
        created_at: persona.created_at
      };
    case 'survey':
      const survey = await Survey.findByPk(id, {
        attributes: ['id', 'name', 'description', 'status', 'created_at']
      });
      if (!survey) return { name: '已删除的问卷', description: '' };
      return {
        name: survey.name,
        summary: survey.description,
        quality_score: null,
        personality_tags: [],
        created_at: survey.created_at
      };
    case 'script':
      const script = await MarketingScript.findByPk(id, {
        attributes: ['id', 'name', 'type', 'content', 'created_at']
      });
      if (!script) return { name: '已删除的脚本', description: '' };
      let scriptSummary = '';
      if (typeof script.content === 'string') {
        scriptSummary = script.content.substring(0, 100);
      } else if (script.content?.scenes?.length) {
        scriptSummary = `包含 ${script.content.scenes.length} 个镜头`;
      } else {
        scriptSummary = JSON.stringify(script.content || '').substring(0, 100);
      }
      return {
        name: script.name,
        summary: scriptSummary,
        quality_score: null,
        personality_tags: [],
        created_at: script.created_at
      };
    case 'suggestion':
      const suggestion = await ProductSuggestion.findByPk(id, {
        attributes: ['id', 'name', 'created_at']
      });
      if (!suggestion) return { name: '已删除的建议', description: '' };
      return {
        name: suggestion.name,
        summary: '',
        quality_score: null,
        personality_tags: [],
        created_at: suggestion.created_at
      };
    default:
      return { name: '未知', summary: '' };
  }
}

module.exports = router;