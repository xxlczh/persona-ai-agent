/**
 * 产品建议路由
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { success, errorWrapper } = require('../utils/apiResponse');
const ProductSuggestionService = require('../services/ProductSuggestionService');

const suggestionService = new ProductSuggestionService();

// 生成产品建议
router.post('/generate', authMiddleware, errorWrapper(async (req, res) => {
  const { projectId, personaId, persona, options } = req.body;
  const userId = req.user.id;

  const report = await suggestionService.generate({
    projectId,
    personaId,
    persona,
    options,
    userId
  });

  success(res, report, '产品建议报告生成成功');
}));

// 获取项目的建议列表
router.get('/project/:projectId', authMiddleware, errorWrapper(async (req, res) => {
  const { projectId } = req.params;
  const { limit = 20, offset = 0 } = req.query;

  const result = await suggestionService.getByProject(parseInt(projectId), {
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  success(res, result);
}));

// 获取建议详情
router.get('/:id', authMiddleware, errorWrapper(async (req, res) => {
  const { id } = req.params;
  const report = await suggestionService.getById(parseInt(id));

  if (!report) {
    return res.status(404).json({ success: false, message: '建议不存在' });
  }

  success(res, report);
}));

// 更新建议
router.put('/:id', authMiddleware, errorWrapper(async (req, res) => {
  const { id } = req.params;
  const report = await suggestionService.update(parseInt(id), req.body);
  success(res, report, '建议更新成功');
}));

// 删除建议
router.delete('/:id', authMiddleware, errorWrapper(async (req, res) => {
  const { id } = req.params;
  await suggestionService.delete(parseInt(id));
  success(res, null, '建议删除成功');
}));

// 导出建议
router.get('/:id/export', authMiddleware, errorWrapper(async (req, res) => {
  const { id } = req.params;
  const reportData = await suggestionService.exportReport(parseInt(id));
  success(res, reportData);
}));

module.exports = router;
