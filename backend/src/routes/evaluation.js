const express = require('express');
const router = express.Router();
const { Persona, Project } = require('../models');
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

    // 直接更新画像的质量评分
    await persona.update({
      quality_score: {
        overall_score: evaluationResult.overall_score,
        overall_level: evaluationResult.overall_level,
        completeness: evaluationResult.dimensions.completeness.score,
        consistency: evaluationResult.dimensions.consistency.score,
        authenticity: evaluationResult.dimensions.authenticity.score,
        actionability: evaluationResult.dimensions.actionability.score,
        last_evaluated_at: new Date().toISOString()
      }
    });

    res.status(201).json({
      success: true,
      message: '评估完成',
      data: {
        persona_id: id,
        overall_score: evaluationResult.overall_score,
        overall_level: evaluationResult.overall_level,
        dimensions: evaluationResult.dimensions
      }
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
 * 获取指定画像的评估历史（从画像的质量评分历史记录）
 */
router.get('/history/:personaId', async (req, res) => {
  try {
    const { personaId } = req.params;

    // 获取画像
    const persona = await Persona.findByPk(personaId);
    if (!persona) {
      return res.status(404).json({
        success: false,
        message: '画像不存在'
      });
    }

    // 如果有历史评估记录，从评估详情 JSON 中恢复
    const history = [];
    if (persona.quality_score && persona.quality_score.last_evaluated_at) {
      history.push({
        persona_id: persona.id,
        overall_score: persona.quality_score.overall_score,
        overall_level: persona.quality_score.overall_level,
        evaluated_at: persona.quality_score.last_evaluated_at
      });
    }

    res.json({
      success: true,
      data: {
        evaluations: history,
        total: history.length,
        limit: 10,
        offset: 0
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

    // 获取项目下的所有画像
    const personas = await Persona.findAll({
      where: { project_id: projectId }
    });

    // 如果没有画像，返回空统计
    if (personas.length === 0) {
      return res.json({
        success: true,
        data: {
          project_id: parseInt(projectId),
          total_personas: 0,
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

    // 辅助函数：将 JSON 字符串或对象转换为质量评分对象
    const getQualityScore = (p) => {
      if (!p.quality_score) return null;
      if (typeof p.quality_score === 'string') {
        try {
          return JSON.parse(p.quality_score);
        } catch {
          return null;
        }
      }
      return p.quality_score;
    };

    // 统计有质量评分的画像（检查 overall 或 overall_score 字段）
    const personasWithScores = personas.filter(p => {
      const qs = getQualityScore(p);
      // 检查 overall 或 overall_score 字段
      const hasScore = qs && (qs.overall !== undefined || qs.overall_score !== undefined);
      return hasScore;
    });
    const totalEvaluations = personasWithScores.length;

    if (totalEvaluations === 0) {
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
    const sumScore = personasWithScores.reduce((sum, p) => {
      const qs = getQualityScore(p);
      let score = qs?.overall || qs?.overall_score || 0;
      // 如果分数小于1，说明是0-1范围，需要转换为0-100
      if (score < 1) score = score * 100;
      return sum + score;
    }, 0);
    const averageScore = sumScore / totalEvaluations;

    // 分数分布 - 根据分数判断等级
    const getLevelFromScore = (qs) => {
      const score = (qs?.overall || qs?.overall_score || 0) < 1
        ? (qs?.overall || qs?.overall_score || 0) * 100
        : (qs?.overall || qs?.overall_score || 0);
      if (score >= 90) return 'excellent';
      if (score >= 75) return 'good';
      if (score >= 60) return 'fair';
      return 'poor';
    };

    const scoreDistribution = {
      excellent: personasWithScores.filter(p => getLevelFromScore(getQualityScore(p)) === 'excellent').length,
      good: personasWithScores.filter(p => getLevelFromScore(getQualityScore(p)) === 'good').length,
      fair: personasWithScores.filter(p => getLevelFromScore(getQualityScore(p)) === 'fair').length,
      poor: personasWithScores.filter(p => getLevelFromScore(getQualityScore(p)) === 'poor').length
    };

    // 维度平均分 - 转换为0-100范围
    const dimensionAverages = {
      completeness: personasWithScores.reduce((sum, p) => {
        const qs = getQualityScore(p);
        let val = qs?.completeness || 0;
        if (val < 1) val = val * 100;
        return sum + val;
      }, 0) / totalEvaluations,
      consistency: personasWithScores.reduce((sum, p) => {
        const qs = getQualityScore(p);
        let val = qs?.consistency || 0;
        if (val < 1) val = val * 100;
        return sum + val;
      }, 0) / totalEvaluations,
      authenticity: personasWithScores.reduce((sum, p) => {
        const qs = getQualityScore(p);
        let val = qs?.authenticity || 0;
        if (val < 1) val = val * 100;
        return sum + val;
      }, 0) / totalEvaluations,
      actionability: personasWithScores.reduce((sum, p) => {
        const qs = getQualityScore(p);
        let val = qs?.actionability || 0;
        if (val < 1) val = val * 100;
        return sum + val;
      }, 0) / totalEvaluations
    };

    // 保留两位小数
    Object.keys(dimensionAverages).forEach(key => {
      dimensionAverages[key] = Math.round(dimensionAverages[key] * 10) / 10;
    });

    // 获取最新评估记录（按 last_evaluated_at 排序，没有则按 id 排序）
    const latestEvaluations = [...personasWithScores]
      .sort((a, b) => {
        const qsA = getQualityScore(a);
        const qsB = getQualityScore(b);
        const dateA = qsA?.last_evaluated_at ? new Date(qsA.last_evaluated_at) : new Date(0);
        const dateB = qsB?.last_evaluated_at ? new Date(qsB.last_evaluated_at) : new Date(0);
        return dateB - dateA;
      })
      .slice(0, 5)
      .map(p => {
        const qs = getQualityScore(p);
        const score = qs?.overall || qs?.overall_score || 0;
        const normalizedScore = score < 1 ? score * 100 : score;
        return {
          persona_id: p.id,
          overall_score: Math.round(normalizedScore),
          overall_level: getLevelFromScore(qs),
          evaluated_at: qs?.last_evaluated_at || p.created_at
        };
      });

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