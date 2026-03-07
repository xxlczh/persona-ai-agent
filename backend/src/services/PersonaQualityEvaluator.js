/**
 * 用户画像质量评估服务
 *
 * 评估维度：
 * 1. 完整性 - 检查各维度字段是否完整填充
 * 2. 一致性 - 检查各维度之间的逻辑一致性
 * 3. 真实性 - 检查数据是否真实可信
 * 4. 可操作性 - 检查画像是否具有实际应用价值
 * 5. 综合评分 - 综合以上维度给出最终评分
 */

class PersonaQualityEvaluator {
  constructor(options = {}) {
    this.weights = {
      completeness: options.completenessWeight || 0.25,
      consistency: options.consistencyWeight || 0.25,
      authenticity: options.authenticityWeight || 0.25,
      actionability: options.actionabilityWeight || 0.25
    };

    // 各维度必填字段定义
    this.requiredFields = {
      demographic: ['age', 'gender', 'location', 'occupation'],
      behavioral: ['purchase_frequency', 'preferred_channels', 'interests'],
      psychological: ['values', 'attitudes', 'motivation'],
      needs: ['explicit_needs', 'latent_needs', 'pain_points'],
      scenario: ['use_cases', 'decision_context', 'touch_points']
    };

    // 评分阈值配置
    this.thresholds = {
      excellent: 90,
      good: 75,
      fair: 60,
      poor: 0
    };
  }

  /**
   * 评估画像质量
   * @param {Object} persona - 用户画像对象
   * @returns {Object} 评估结果
   */
  async evaluate(persona) {
    // 1. 完整性评估
    const completenessResult = this.evaluateCompleteness(persona);

    // 2. 一致性评估
    const consistencyResult = this.evaluateConsistency(persona);

    // 3. 真实性评估
    const authenticityResult = this.evaluateAuthenticity(persona);

    // 4. 可操作性评估
    const actionabilityResult = this.evaluateActionability(persona);

    // 5. 综合评分
    const overallScore = this.calculateOverallScore({
      completeness: completenessResult.score,
      consistency: consistencyResult.score,
      authenticity: authenticityResult.score,
      actionability: actionabilityResult.score
    });

    return {
      persona_id: persona.id,
      overall_score: overallScore,
      overall_level: this.getLevel(overallScore),
      dimensions: {
        completeness: completenessResult,
        consistency: consistencyResult,
        authenticity: authenticityResult,
        actionability: actionabilityResult
      },
      evaluated_at: new Date().toISOString()
    };
  }

  // ==================== 完整性评估 ====================

  /**
   * 评估画像完整性
   * 检查各维度字段是否完整填充
   */
  evaluateCompleteness(persona) {
    const dimensionScores = {};
    let totalWeight = 0;
    let weightedSum = 0;

    // 评估每个维度的完整性
    for (const [dimension, requiredFields] of Object.entries(this.requiredFields)) {
      const dimensionData = persona[dimension] || {};
      const filledFields = requiredFields.filter(field => {
        const value = dimensionData[field];
        return value !== undefined && value !== null && value !== '';
      });

      const dimensionScore = (filledFields.length / requiredFields.length) * 100;
      dimensionScores[dimension] = {
        score: dimensionScore,
        filled: filledFields.length,
        total: requiredFields.length,
        missing: requiredFields.filter(f => !filledFields.includes(f))
      };

      // 根据维度重要性计算权重
      const weight = this.getDimensionWeight(dimension);
      weightedSum += dimensionScore * weight;
      totalWeight += weight;
    }

    // 评估其他关键字段
    const additionalChecks = this.checkAdditionalFields(persona);
    weightedSum += additionalChecks.score * 0.15;
    totalWeight += 0.15;

    const finalScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

    return {
      score: Math.round(finalScore * 10) / 10,
      level: this.getLevel(finalScore),
      dimensions: dimensionScores,
      additional_fields: additionalChecks,
      suggestions: this.generateCompletenessSuggestions(dimensionScores)
    };
  }

  /**
   * 检查额外关键字段
   */
  checkAdditionalFields(persona) {
    const checks = [
      { field: 'name', value: persona.name, weight: 1 },
      { field: 'summary', value: persona.summary, weight: 1.5 },
      { field: 'personality_tags', value: persona.personality_tags, weight: 1 },
      { field: 'communication_style', value: persona.communication_style, weight: 1 },
      { field: 'marketing_suggestions', value: persona.marketing_suggestions, weight: 2 }
    ];

    let totalWeight = 0;
    let filledWeight = 0;

    for (const check of checks) {
      const isFilled = check.value &&
        (Array.isArray(check.value) ? check.value.length > 0 :
         (typeof check.value === 'string' ? check.value.trim() !== '' : true));

      totalWeight += check.weight;
      if (isFilled) filledWeight += check.weight;
    }

    return {
      score: (filledWeight / totalWeight) * 100,
      checked: checks.length,
      filled: checks.filter(c => {
        const val = c.value;
        return val && (Array.isArray(val) ? val.length > 0 :
          (typeof val === 'string' ? val.trim() !== '' : true));
      }).length
    };
  }

  // ==================== 一致性评估 ====================

  /**
   * 评估画像一致性
   * 检查各维度之间的逻辑一致性
   */
  evaluateConsistency(persona) {
    const inconsistencies = [];

    // 1. 年龄与职业一致性
    const ageConsistency = this.checkAgeOccupationConsistency(
      persona.demographic,
      persona.behavioral
    );
    if (!ageConsistency.isConsistent) {
      inconsistencies.push(ageConsistency);
    }

    // 2. 行为与需求一致性
    const behaviorNeedConsistency = this.checkBehaviorNeedConsistency(
      persona.behavioral,
      persona.needs
    );
    if (!behaviorNeedConsistency.isConsistent) {
      inconsistencies.push(behaviorNeedConsistency);
    }

    // 3. 心理与场景一致性
    const psychoScenarioConsistency = this.checkPsychologicalScenarioConsistency(
      persona.psychological,
      persona.scenario
    );
    if (!psychoScenarioConsistency.isConsistent) {
      inconsistencies.push(psychoScenarioConsistency);
    }

    // 4. 人口统计与行为一致性
    const demoBehaviorConsistency = this.checkDemographicBehaviorConsistency(
      persona.demographic,
      persona.behavioral
    );
    if (!demoBehaviorConsistency.isConsistent) {
      inconsistencies.push(demoBehaviorConsistency);
    }

    // 5. 标签与描述一致性
    const tagDescriptionConsistency = this.checkTagDescriptionConsistency(persona);
    if (!tagDescriptionConsistency.isConsistent) {
      inconsistencies.push(tagDescriptionConsistency);
    }

    // 计算一致性得分
    const totalChecks = 5;
    const consistentChecks = totalChecks - inconsistencies.length;
    const score = (consistentChecks / totalChecks) * 100;

    return {
      score: Math.round(score * 10) / 10,
      level: this.getLevel(score),
      inconsistencies: inconsistencies,
      summary: inconsistencies.length === 0
        ? '所有维度逻辑一致'
        : `发现 ${inconsistencies.length} 处不一致`
    };
  }

  /**
   * 检查年龄与职业一致性
   */
  checkAgeOccupationConsistency(demographic, behavioral) {
    const age = demographic?.age;
    const occupation = demographic?.occupation;

    if (!age || !occupation) {
      return { isConsistent: true, reason: '缺少必要字段' };
    }

    // 职业类型与年龄的典型匹配检查
    const youngProfessions = ['实习生', '初级工程师', '助理', '学生'];
    const seniorProfessions = ['总监', '经理', '专家', '顾问'];

    const isYoung = age < 30;
    const isSenior = age > 45;

    if (isYoung && seniorProfessions.some(p => occupation.includes(p))) {
      return {
        isConsistent: false,
        type: 'age_occupation_mismatch',
        message: `年龄 ${age} 岁与职业 "${occupation}" 可能不匹配`,
        severity: 'medium'
      };
    }

    if (isSenior && youngProfessions.some(p => occupation.includes(p))) {
      return {
        isConsistent: false,
        type: 'age_occupation_mismatch',
        message: `年龄 ${age} 岁与职业 "${occupation}" 可能不匹配`,
        severity: 'medium'
      };
    }

    return { isConsistent: true };
  }

  /**
   * 检查行为与需求一致性
   */
  checkBehaviorNeedConsistency(behavioral, needs) {
    const purchaseFrequency = behavioral?.purchase_frequency;
    const explicitNeeds = needs?.explicit_needs || [];
    const latentNeeds = needs?.latent_needs || [];

    if (!purchaseFrequency && explicitNeeds.length === 0) {
      return { isConsistent: true, reason: '缺少必要字段' };
    }

    // 高频购买但无明确需求可能不一致
    if (purchaseFrequency === 'high' && explicitNeeds.length === 0) {
      return {
        isConsistent: false,
        type: 'behavior_need_mismatch',
        message: '高频购买但无明确需求描述',
        severity: 'low'
      };
    }

    return { isConsistent: true };
  }

  /**
   * 检查心理与场景一致性
   */
  checkPsychologicalScenarioConsistency(psychological, scenario) {
    const values = psychological?.values || [];
    const useCases = scenario?.use_cases || [];

    if (values.length === 0 && useCases.length === 0) {
      return { isConsistent: true, reason: '缺少必要字段' };
    }

    // 检查价值观与使用场景是否匹配 (简化版)
    const hasConvenienceValue = values.some(v =>
      v.toLowerCase().includes('便利') || v.toLowerCase().includes('效率')
    );
    const hasConvenienceUseCase = useCases.some(u =>
      u.toLowerCase().includes('便捷') || u.toLowerCase().includes('快速')
    );

    if (hasConvenienceValue && !hasConvenienceUseCase && useCases.length > 0) {
      return {
        isConsistent: false,
        type: 'value_scenario_mismatch',
        message: '重视便利性但使用场景未体现',
        severity: 'low'
      };
    }

    return { isConsistent: true };
  }

  /**
   * 检查人口统计与行为一致性
   */
  checkDemographicBehaviorConsistency(demographic, behavioral) {
    const location = demographic?.location;
    const preferredChannels = behavioral?.preferred_channels || [];

    if (!location && preferredChannels.length === 0) {
      return { isConsistent: true, reason: '缺少必要字段' };
    }

    // 一线城市用户更倾向于线上渠道
    const firstTierCities = ['北京', '上海', '广州', '深圳', '杭州', '南京'];
    const isFirstTier = firstTierCities.some(city => location?.includes(city));
    const hasOfflineChannel = preferredChannels.some(ch =>
      ['线下', '门店', '实体店'].some(offline => ch.includes(offline))
    );

    if (isFirstTier && !hasOfflineChannel && preferredChannels.length > 0) {
      // 一线城市用户无线上渠道偏好，可能不一致但不是严重问题
      return {
        isConsistent: false,
        type: 'location_channel_mismatch',
        message: '一线城市用户但偏好线下渠道',
        severity: 'low'
      };
    }

    return { isConsistent: true };
  }

  /**
   * 检查标签与描述一致性
   */
  checkTagDescriptionConsistency(persona) {
    const tags = persona.personality_tags || [];
    const summary = persona.summary || '';
    const communicationStyle = persona.communication_style || '';

    if (tags.length === 0) {
      return { isConsistent: true, reason: '无性格标签' };
    }

    // 检查标签是否在描述中有体现
    const textContent = `${summary} ${communicationStyle}`.toLowerCase();
    const unmatchedTags = tags.filter(tag =>
      !textContent.includes(tag.toLowerCase())
    );

    if (unmatchedTags.length > tags.length * 0.5) {
      return {
        isConsistent: false,
        type: 'tag_description_mismatch',
        message: `${unmatchedTags.length} 个标签在描述中未体现`,
        severity: 'medium'
      };
    }

    return { isConsistent: true };
  }

  // ==================== 真实性评估 ====================

  /**
   * 评估画像真实性
   * 检查数据是否真实可信
   */
  evaluateAuthenticity(persona) {
    const authenticityChecks = [];

    // 1. 数据完整性真实性
    const completenessCheck = this.checkDataCompletenessAuthenticity(persona);
    authenticityChecks.push(completenessCheck);

    // 2. 数据合理性
    const reasonablenessCheck = this.checkDataReasonableness(persona);
    authenticityChecks.push(reasonablenessCheck);

    // 3. 细节丰富度
    const detailCheck = this.checkDetailRichness(persona);
    authenticityChecks.push(detailCheck);

    // 4. 数据来源可信度
    const sourceCheck = this.checkSourceCredibility(persona);
    authenticityChecks.push(sourceCheck);

    // 计算真实性得分
    const passedChecks = authenticityChecks.filter(c => c.passed).length;
    const score = (passedChecks / authenticityChecks.length) * 100;

    return {
      score: Math.round(score * 10) / 10,
      level: this.getLevel(score),
      checks: authenticityChecks,
      summary: `通过 ${passedChecks}/${authenticityChecks.length} 项真实性检查`
    };
  }

  /**
   * 检查数据完整性真实性
   */
  checkDataCompletenessAuthenticity(persona) {
    const dimensionCount = Object.keys(this.requiredFields).filter(d =>
      persona[d] && Object.keys(persona[d]).length > 0
    ).length;

    const hasBasicInfo = persona.name && persona.summary;
    const hasMultipleDimensions = dimensionCount >= 4;

    const passed = hasBasicInfo && hasMultipleDimensions;

    return {
      name: '数据完整性',
      passed,
      message: passed
        ? '数据维度完整'
        : '数据维度不完整，可能影响真实性',
      score: passed ? 100 : 50
    };
  }

  /**
   * 检查数据合理性
   */
  checkDataReasonableness(persona) {
    const issues = [];

    // 检查年龄合理性
    const age = persona.demographic?.age;
    if (age && (age < 1 || age > 120)) {
      issues.push(`年龄 ${age} 不合理`);
    }

    // 检查数据非空
    const emptyDimensions = Object.entries(persona).filter(([key, value]) => {
      if (['id', 'project_id', 'name', 'summary', 'status'].includes(key)) return false;
      if (typeof value !== 'object') return false;
      return !value || Object.keys(value).length === 0;
    });

    if (emptyDimensions.length > 3) {
      issues.push(`${emptyDimensions.length} 个维度为空`);
    }

    const passed = issues.length === 0;

    return {
      name: '数据合理性',
      passed,
      message: passed ? '数据合理' : issues.join('; '),
      score: passed ? 100 : Math.max(0, 100 - issues.length * 25)
    };
  }

  /**
   * 检查细节丰富度
   */
  checkDetailRichness(persona) {
    let totalDetailScore = 0;
    let dimensionCount = 0;

    for (const [dimension, requiredFields] of Object.entries(this.requiredFields)) {
      const data = persona[dimension] || {};
      let dimensionScore = 0;

      for (const field of requiredFields) {
        const value = data[field];
        if (value) {
          if (Array.isArray(value)) {
            dimensionScore += Math.min(value.length * 20, 40);
          } else if (typeof value === 'string') {
            dimensionScore += Math.min(value.length * 2, 60);
          } else {
            dimensionScore += 30;
          }
        }
      }

      totalDetailScore += Math.min(dimensionScore, 100);
      dimensionCount++;
    }

    const avgScore = dimensionCount > 0 ? totalDetailScore / dimensionCount : 0;
    const passed = avgScore >= 50;

    return {
      name: '细节丰富度',
      passed,
      message: passed ? '数据细节丰富' : '数据细节不足',
      score: avgScore
    };
  }

  /**
   * 检查数据来源可信度
   */
  checkSourceCredibility(persona) {
    const sourceDataIds = persona.source_data_ids || [];
    const generationConfig = persona.generation_config || {};

    // 有数据源引用更可信
    const hasSourceData = sourceDataIds.length > 0;

    // 有生成配置说明
    const hasConfig = Object.keys(generationConfig).length > 0;

    const score = (hasSourceData ? 40 : 0) + (hasConfig ? 30 : 0) + 30;
    const passed = score >= 60;

    return {
      name: '来源可信度',
      passed,
      message: hasSourceData
        ? `基于 ${sourceDataIds.length} 个数据源生成`
        : '缺乏数据源信息',
      score
    };
  }

  // ==================== 可操作性评估 ====================

  /**
   * 评估画像可操作性
   * 检查画像是否具有实际应用价值
   */
  evaluateActionability(persona) {
    const actionabilityChecks = [];

    // 1. 营销建议可用性
    const marketingCheck = this.checkMarketingActionability(persona);
    actionabilityChecks.push(marketingCheck);

    // 2. 场景可执行性
    const scenarioCheck = this.checkScenarioActionability(persona);
    actionabilityChecks.push(scenarioCheck);

    // 3. 需求可转化性
    const needCheck = this.checkNeedActionability(persona);
    actionabilityChecks.push(needCheck);

    // 4. 画像可应用性
    const applicationCheck = this.checkApplicationActionability(persona);
    actionabilityChecks.push(applicationCheck);

    // 计算可操作性得分
    const passedChecks = actionabilityChecks.filter(c => c.passed).length;
    const score = (passedChecks / actionabilityChecks.length) * 100;

    return {
      score: Math.round(score * 10) / 10,
      level: this.getLevel(score),
      checks: actionabilityChecks,
      suggestions: this.generateActionabilitySuggestions(actionabilityChecks),
      summary: `通过 ${passedChecks}/${actionabilityChecks.length} 项可操作性检查`
    };
  }

  /**
   * 检查营销建议可用性
   */
  checkMarketingActionability(persona) {
    const suggestions = persona.marketing_suggestions || [];

    const hasSuggestions = suggestions.length > 0;
    const hasSpecificContent = suggestions.every(s =>
      typeof s === 'string' && s.length > 10
    );

    const score = hasSuggestions ? (hasSpecificContent ? 100 : 60) : 0;
    const passed = hasSuggestions && hasSpecificContent;

    return {
      name: '营销建议可用性',
      passed,
      message: passed
        ? `${suggestions.length} 条可操作的营销建议`
        : '缺乏具体营销建议',
      score
    };
  }

  /**
   * 检查场景可执行性
   */
  checkScenarioActionability(persona) {
    const scenario = persona.scenario || {};
    const useCases = scenario.use_cases || [];
    const touchPoints = scenario.touch_points || [];

    const hasUseCases = useCases.length > 0;
    const hasTouchPoints = touchPoints.length > 0;

    const score = (hasUseCases ? 50 : 0) + (hasTouchPoints ? 50 : 0);
    const passed = hasUseCases && hasTouchPoints;

    return {
      name: '场景可执行性',
      passed,
      message: passed
        ? `包含 ${useCases.length} 个使用场景和 ${touchPoints.length} 个触点`
        : '场景或触点不完整',
      score
    };
  }

  /**
   * 检查需求可转化性
   */
  checkNeedActionability(persona) {
    const needs = persona.needs || {};
    const explicitNeeds = needs.explicit_needs || [];
    const latentNeeds = needs.latent_needs || [];
    const painPoints = needs.pain_points || [];

    const hasNeeds = explicitNeeds.length > 0 || latentNeeds.length > 0;
    const hasPainPoints = painPoints.length > 0;

    // 有痛点和需求才能转化
    const score = hasNeeds ? (hasPainPoints ? 100 : 70) : 0;
    const passed = hasNeeds && hasPainPoints;

    return {
      name: '需求可转化性',
      passed,
      message: passed
        ? `包含 ${explicitNeeds.length + latentNeeds.length} 个需求和 ${painPoints.length} 个痛点`
        : '缺乏需求或痛点信息',
      score
    };
  }

  /**
   * 检查画像可应用性
   */
  checkApplicationActionability(persona) {
    const hasSummary = persona.summary && persona.summary.length > 50;
    const hasTags = persona.personality_tags && persona.personality_tags.length > 0;
    const hasCommunicationStyle = persona.communication_style &&
      persona.communication_style.length > 10;

    const score = (hasSummary ? 35 : 0) + (hasTags ? 30 : 0) +
      (hasCommunicationStyle ? 35 : 0);
    const passed = score >= 70;

    return {
      name: '画像可应用性',
      passed,
      message: passed
        ? '画像具备足够的应用信息'
        : '画像信息不足以支撑应用',
      score
    };
  }

  // ==================== 综合评分 ====================

  /**
   * 计算综合评分
   */
  calculateOverallScore(dimensionScores) {
    const {
      completeness,
      consistency,
      authenticity,
      actionability
    } = dimensionScores;

    const weightedScore =
      completeness * this.weights.completeness +
      consistency * this.weights.consistency +
      authenticity * this.weights.authenticity +
      actionability * this.weights.actionability;

    return Math.round(weightedScore * 10) / 10;
  }

  /**
   * 获取评分等级
   */
  getLevel(score) {
    if (score >= this.thresholds.excellent) return 'excellent';
    if (score >= this.thresholds.good) return 'good';
    if (score >= this.thresholds.fair) return 'fair';
    return 'poor';
  }

  /**
   * 获取维度权重
   */
  getDimensionWeight(dimension) {
    const weights = {
      demographic: 0.25,
      behavioral: 0.25,
      psychological: 0.2,
      needs: 0.2,
      scenario: 0.1
    };
    return weights[dimension] || 0.1;
  }

  /**
   * 生成完整性建议
   */
  generateCompletenessSuggestions(dimensionScores) {
    const suggestions = [];

    for (const [dimension, result] of Object.entries(dimensionScores)) {
      if (result.score < 60) {
        suggestions.push({
          dimension,
          message: `${dimension} 维度缺少: ${result.missing.join(', ')}`,
          priority: result.score < 40 ? 'high' : 'medium'
        });
      }
    }

    return suggestions;
  }

  /**
   * 生成可操作性建议
   */
  generateActionabilitySuggestions(checks) {
    const suggestions = [];

    for (const check of checks) {
      if (!check.passed) {
        suggestions.push({
          name: check.name,
          message: check.message,
          score: check.score
        });
      }
    }

    return suggestions;
  }
}

module.exports = PersonaQualityEvaluator;
