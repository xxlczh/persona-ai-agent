/**
 * 营销脚本路由
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { success, errorWrapper } = require('../utils/apiResponse');
const MarketingScriptService = require('../services/MarketingScriptService');

const scriptService = new MarketingScriptService();

// 生成营销脚本
router.post('/generate', authMiddleware, errorWrapper(async (req, res) => {
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
}));

// 获取项目的脚本列表
router.get('/project/:projectId', authMiddleware, errorWrapper(async (req, res) => {
  const { projectId } = req.params;
  const { limit = 20, offset = 0, type } = req.query;

  const result = await scriptService.getByProject(parseInt(projectId), {
    limit: parseInt(limit),
    offset: parseInt(offset),
    type
  });

  success(res, result);
}));

// 获取脚本详情
router.get('/:id', authMiddleware, errorWrapper(async (req, res) => {
  const { id } = req.params;
  const script = await scriptService.getById(parseInt(id));

  if (!script) {
    return res.status(404).json({ success: false, message: '脚本不存在' });
  }

  success(res, script);
}));

// 更新脚本
router.put('/:id', authMiddleware, errorWrapper(async (req, res) => {
  const { id } = req.params;
  const script = await scriptService.update(parseInt(id), req.body);
  success(res, script, '脚本更新成功');
}));

// 删除脚本
router.delete('/:id', authMiddleware, errorWrapper(async (req, res) => {
  const { id } = req.params;
  await scriptService.delete(parseInt(id));
  success(res, null, '脚本删除成功');
}));

// 导出脚本
router.get('/:id/export', authMiddleware, errorWrapper(async (req, res) => {
  const { id } = req.params;
  const scriptData = await scriptService.exportScript(parseInt(id));
  success(res, scriptData);
}));

module.exports = router;
