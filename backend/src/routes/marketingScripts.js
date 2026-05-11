/**
 * 营销脚本路由
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { success } = require('../utils/apiResponse');
const MarketingScriptService = require('../services/MarketingScriptService');

const scriptService = new MarketingScriptService();

// 生成营销脚本
router.post('/generate', authenticate, async (req, res) => {
  try {
    const { projectId, personaId, persona, options } = req.body;
    const userId = req.user.id;

    const script = await scriptService.generate({
      projectId,
      personaId,
      persona,
      options,
      userId
    });

    success(res, script, '营销脚本生成成功');
  } catch (error) {
    console.error('生成营销脚本失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取项目的脚本列表
router.get('/project/:projectId', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { limit = 20, offset = 0, type } = req.query;

    const result = await scriptService.getByProject(parseInt(projectId), {
      limit: parseInt(limit),
      offset: parseInt(offset),
      type
    });

    success(res, result);
  } catch (error) {
    console.error('获取脚本列表失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取脚本详情
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const script = await scriptService.getById(parseInt(id));

    if (!script) {
      return res.status(404).json({ success: false, message: '脚本不存在' });
    }

    success(res, script);
  } catch (error) {
    console.error('获取脚本详情失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 更新脚本
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const script = await scriptService.update(parseInt(id), req.body);
    success(res, script, '脚本更新成功');
  } catch (error) {
    console.error('更新脚本失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 删除脚本
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    await scriptService.delete(parseInt(id));
    success(res, null, '脚本删除成功');
  } catch (error) {
    console.error('删除脚本失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 导出脚本
router.get('/:id/export', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const scriptData = await scriptService.exportScript(parseInt(id));
    success(res, scriptData);
  } catch (error) {
    console.error('导出脚本失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
