/**
 * 问卷管理路由
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { success, errorWrapper } = require('../utils/apiResponse');
const SurveyService = require('../services/SurveyService');

const surveyService = new SurveyService();

// 生成问卷
router.post('/generate', authMiddleware, errorWrapper(async (req, res) => {
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
}));

// 获取项目的问卷列表
router.get('/project/:projectId', authMiddleware, errorWrapper(async (req, res) => {
  const { projectId } = req.params;
  const { limit = 20, offset = 0 } = req.query;

  const result = await surveyService.getByProject(parseInt(projectId), {
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  success(res, result);
}));

// 获取问卷详情
router.get('/:id', authMiddleware, errorWrapper(async (req, res) => {
  const { id } = req.params;
  const survey = await surveyService.getById(parseInt(id));

  if (!survey) {
    return res.status(404).json({ success: false, message: '问卷不存在' });
  }

  success(res, survey);
}));

// 更新问卷
router.put('/:id', authMiddleware, errorWrapper(async (req, res) => {
  const { id } = req.params;
  const survey = await surveyService.update(parseInt(id), req.body);
  success(res, survey, '问卷更新成功');
}));

// 删除问卷
router.delete('/:id', authMiddleware, errorWrapper(async (req, res) => {
  const { id } = req.params;
  await surveyService.delete(parseInt(id));
  success(res, null, '问卷删除成功');
}));

// 导出问卷
router.get('/:id/export', authMiddleware, errorWrapper(async (req, res) => {
  const { id } = req.params;
  const surveyData = await surveyService.exportSurvey(parseInt(id));
  success(res, surveyData);
}));

module.exports = router;
