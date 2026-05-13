const express = require('express');
const { Share, User, Persona, Survey, MarketingScript, ProductSuggestion } = require('../models');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/gallery - 获取作品广场列表（公开）
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // 构建查询条件
    const where = { status: 'shared' };
    if (type && ['persona', 'survey', 'script', 'suggestion'].includes(type)) {
      where.resource_type = type;
    }

    const { count, rows: shares } = await Share.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'nickname', 'avatar']
      }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
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
      data: {
        items,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Gallery error:', error);
    res.status(500).json({
      success: false,
      message: '获取作品列表失败'
    });
  }
});

// 辅助函数：获取资源详细信息
async function getResourceDetail(type, id) {
  switch (type) {
    case 'persona':
      const persona = await Persona.findByPk(id, {
        attributes: ['id', 'name', 'summary', 'quality_score', 'personality_tags', 'created_at']
      });
      if (!persona) return { name: '已删除的画像', summary: '', quality_score: null, personality_tags: [] };
      return {
        name: persona.name,
        summary: persona.summary,
        quality_score: persona.quality_score,
        personality_tags: persona.personality_tags || [],
        created_at: persona.created_at
      };
    case 'survey':
      const survey = await Survey.findByPk(id, {
        attributes: ['id', 'name', 'description', 'status', 'created_at']
      });
      if (!survey) return { name: '已删除的问卷', summary: '', quality_score: null, personality_tags: [] };
      return {
        name: survey.name,
        summary: survey.description || '',
        quality_score: null,
        personality_tags: [],
        created_at: survey.created_at
      };
    case 'script':
      const script = await MarketingScript.findByPk(id, {
        attributes: ['id', 'name', 'type', 'content', 'created_at']
      });
      if (!script) return { name: '已删除的脚本', summary: '', quality_score: null, personality_tags: [] };
      return {
        name: script.name,
        summary: script.content?.substring(0, 100) || '',
        quality_score: null,
        personality_tags: [],
        created_at: script.created_at
      };
    case 'suggestion':
      const suggestion = await ProductSuggestion.findByPk(id, {
        attributes: ['id', 'name', 'created_at']
      });
      if (!suggestion) return { name: '已删除的建议', summary: '', quality_score: null, personality_tags: [] };
      return {
        name: suggestion.name,
        summary: '',
        quality_score: null,
        personality_tags: [],
        created_at: suggestion.created_at
      };
    default:
      return { name: '未知', summary: '', quality_score: null, personality_tags: [] };
  }
}

module.exports = router;