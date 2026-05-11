/**
 * 产品建议路由
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { success } = require('../utils/apiResponse');
const ProductSuggestionService = require('../services/ProductSuggestionService');

const suggestionService = new ProductSuggestionService();

// 生成产品建议
router.post('/generate', authenticate, async (req, res) => {
  try {
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
  } catch (error) {
    console.error('生成产品建议失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取项目的建议列表
router.get('/project/:projectId', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const result = await suggestionService.getByProject(parseInt(projectId), {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    success(res, result);
  } catch (error) {
    console.error('获取建议列表失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取建议详情
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const report = await suggestionService.getById(parseInt(id));

    if (!report) {
      return res.status(404).json({ success: false, message: '建议不存在' });
    }

    success(res, report);
  } catch (error) {
    console.error('获取建议详情失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 更新建议
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const report = await suggestionService.update(parseInt(id), req.body);
    success(res, report, '建议更新成功');
  } catch (error) {
    console.error('更新建议失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 删除建议
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    await suggestionService.delete(parseInt(id));
    success(res, null, '建议删除成功');
  } catch (error) {
    console.error('删除建议失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 导出建议
router.get('/:id/export', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const reportData = await suggestionService.exportReport(parseInt(id));
    success(res, reportData);
  } catch (error) {
    console.error('导出建议失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
