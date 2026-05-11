/**
 * 问卷管理路由
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { success } = require('../utils/apiResponse');
const SurveyService = require('../services/SurveyService');

const surveyService = new SurveyService();

// 生成问卷
router.post('/generate', authenticate, async (req, res) => {
  try {
    const { projectId, personaId, persona, options } = req.body;
    const userId = req.user.id;

    const survey = await surveyService.generate({
      projectId,
      personaId,
      persona,
      options,
      userId
    });

    success(res, survey, '问卷生成成功');
  } catch (error) {
    console.error('生成问卷失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取项目的问卷列表
router.get('/project/:projectId', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const result = await surveyService.getByProject(parseInt(projectId), {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    success(res, result);
  } catch (error) {
    console.error('获取问卷列表失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取问卷详情
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const survey = await surveyService.getById(parseInt(id));

    if (!survey) {
      return res.status(404).json({ success: false, message: '问卷不存在' });
    }

    success(res, survey);
  } catch (error) {
    console.error('获取问卷详情失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 更新问卷
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const survey = await surveyService.update(parseInt(id), req.body);
    success(res, survey, '问卷更新成功');
  } catch (error) {
    console.error('更新问卷失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 删除问卷
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    await surveyService.delete(parseInt(id));
    success(res, null, '问卷删除成功');
  } catch (error) {
    console.error('删除问卷失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 导出问卷
router.get('/:id/export', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const surveyData = await surveyService.exportSurvey(parseInt(id));
    success(res, surveyData);
  } catch (error) {
    console.error('导出问卷失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
