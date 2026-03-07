const express = require('express');
const router = express.Router();
const { Persona, Evaluation, Project } = require('../models');
const PersonaQualityEvaluator = require('../services/PersonaQualityEvaluator');

/**
 * POST /api/evaluation/persona/:id
 * 对指定画像进行质量评估
 */
router.post('/persona/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { evaluated_by } = req.body;

    // 获取画像
    const persona = await Persona.findByPk(id);
    if (!persona) {
      return res.status(404).json({
        success: false,
        message: '画像不存在'
      });
    }

    // 创建评估器并执行评估
    const evaluator = new PersonaQualityEvaluator();
    const evaluationResult = await evaluator.evaluate(persona.toJSON());

    // 保存评估结果到数据库
    const evaluation = await Evaluation.create({
      persona_id: id,
      project_id: persona.project_id,
      overall_score: evaluationResult.overall_score,
      overall_level: evaluationResult.overall_level,
      completeness_score: evaluationResult.dimensions.completeness.score,
      consistency_score: evaluationResult.dimensions.consistency.score,
      authenticity_score: evaluationResult.dimensions.authenticity.score,
      actionability_score: evaluationResult.dimensions.actionability.score,
      details: evaluationResult,
      evaluated_by: evaluated_by || 'system'
    });

    // 更新画像的最新质量评分
    await persona.update({
      quality_score: {
        overall_score: evaluationResult.overall_score,
        overall_level: evaluationResult.overall_level,
        last_evaluated_at: new Date().toISOString()
      }
    });

    res.status(201).json({
      success: true,
      message: '评估完成',
      data: evaluation
    });
  } catch (error) {
    console.error('评估失败:', error);
    res.status(500).json({
      success: false,
      message: '评估失败',
      error: error.message
    });
  }
});

/**
 * GET /api/evaluation/history/:personaId
 * 获取指定画像的评估历史
 */
router.get('/history/:personaId', async (req, res) => {
  try {
    const { personaId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    // 验证画像是否存在
    const persona = await Persona.findByPk(personaId);
    if (!persona) {
      return res.status(404).json({
        success: false,
        message: '画像不存在'
      });
    }

    // 获取评估历史
    const evaluations = await Evaluation.findAndCountAll({
      where: { persona_id: personaId },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        evaluations: evaluations.rows,
        total: evaluations.count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('获取评估历史失败:', error);
    res.status(500).json({
      success: false,
      message: '获取评估历史失败',
      error: error.message
    });
  }
});

/**
 * GET /api/evaluation/statistics/:projectId
 * 获取指定项目的评估统计
 */
router.get('/statistics/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    // 验证项目是否存在
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    // 获取项目的所有评估记录
    const evaluations = await Evaluation.findAll({
      where: { project_id: projectId },
      order: [['created_at', 'DESC']]
    });

    // 获取项目下的所有画像
    const personas = await Persona.findAll({
      where: { project_id: projectId }
    });

    if (evaluations.length === 0) {
      return res.json({
        success: true,
        data: {
          project_id: projectId,
          total_personas: personas.length,
          total_evaluations: 0,
          average_score: 0,
          score_distribution: {
            excellent: 0,
            good: 0,
            fair: 0,
            poor: 0
          },
          dimension_averages: {
            completeness: 0,
            consistency: 0,
            authenticity: 0,
            actionability: 0
          },
          latest_evaluations: []
        }
      });
    }

    // 计算统计数据
    const totalEvaluations = evaluations.length;
    const sumScore = evaluations.reduce((sum, e) => sum + e.overall_score, 0);
    const averageScore = sumScore / totalEvaluations;

    // 分数分布
    const scoreDistribution = {
      excellent: evaluations.filter(e => e.overall_level === 'excellent').length,
      good: evaluations.filter(e => e.overall_level === 'good').length,
      fair: evaluations.filter(e => e.overall_level === 'fair').length,
      poor: evaluations.filter(e => e.overall_level === 'poor').length
    };

    // 维度平均分
    const dimensionAverages = {
      completeness: evaluations.reduce((sum, e) => sum + (e.completeness_score || 0), 0) / totalEvaluations,
      consistency: evaluations.reduce((sum, e) => sum + (e.consistency_score || 0), 0) / totalEvaluations,
      authenticity: evaluations.reduce((sum, e) => sum + (e.authenticity_score || 0), 0) / totalEvaluations,
      actionability: evaluations.reduce((sum, e) => sum + (e.actionability_score || 0), 0) / totalEvaluations
    };

    // 保留两位小数
    Object.keys(dimensionAverages).forEach(key => {
      dimensionAverages[key] = Math.round(dimensionAverages[key] * 10) / 10;
    });

    // 获取最新评估记录 (每个画像取最新的)
    const latestByPersona = {};
    evaluations.forEach(e => {
      if (!latestByPersona[e.persona_id] || new Date(e.created_at) > new Date(latestByPersona[e.persona_id].created_at)) {
        latestByPersona[e.persona_id] = e;
      }
    });

    const latestEvaluations = Object.values(latestByPersona)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
      .map(e => ({
        persona_id: e.persona_id,
        overall_score: e.overall_score,
        overall_level: e.overall_level,
        evaluated_at: e.created_at
      }));

    res.json({
      success: true,
      data: {
        project_id: projectId,
        total_personas: personas.length,
        total_evaluations: totalEvaluations,
        average_score: Math.round(averageScore * 10) / 10,
        score_distribution: scoreDistribution,
        dimension_averages: dimensionAverages,
        latest_evaluations: latestEvaluations
      }
    });
  } catch (error) {
    console.error('获取评估统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取评估统计失败',
      error: error.message
    });
  }
});

module.exports = router;
