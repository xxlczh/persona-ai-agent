/**
 * 扩展功能 Prompt 管理器
 * 提供问卷生成、营销脚本、产品建议等 Prompt 模板
 */

class ExtensionPrompts {
  /**
   * 用研问卷生成 Prompt
   * 根据用户画像自动生成用户研究报告问卷
   */
  static getSurveyPrompt(persona, options = {}) {
    const {
      questionCount = 15,
      includeLogicJump = true,
      targetAudience = ''
    } = options;

    return {
      role: 'user',
      content: `你是一个专业的用户研究员。请根据以下用户画像，生成一份用户研究问卷。

## 用户画像
${JSON.stringify(persona, null, 2)}

## 问卷配置
- 问题数量：${questionCount}题（默认15-20题）
- 包含逻辑跳转：${includeLogicJump ? '是' : '否'}
- 目标受众：${targetAudience || '根据画像描述的目标人群'}

## 生成要求
1. 问卷应覆盖以下维度：
   - 基本信息（年龄、性别、职业等）
   - 行为习惯（使用频率、购买行为等）
   - 态度观点（满意度、偏好等）
   - 痛点需求（未满足需求、困扰等）
   - 使用场景（何时何地如何使用）

2. 题型搭配合理：
   - 单选题、多选题、量表题、开放题
   - 量表题使用5点或7点量表

3. 逻辑跳转设置合理（前一个问题的答案影响后续问题）

4. 问题语言要专业、易懂、无诱导性

## 输出格式
请以JSON格式输出：
{
  "survey_title": "string", // 问卷标题
  "survey_intro": "string", // 问卷引言/开场白
  "questions": [
    {
      "id": "number",
      "type": "single_choice | multiple_choice | scale | open_ended",
      "required": "boolean",
      "question_text": "string",
      "options": ["string"] | null, // 选择题选项或null
      "scale_points": "number" | null, // 量表点数或null
      "scale_labels": { // 量表标签
        "low": "string",
        "high": "string"
      } | null,
      "logic_jump": {
        "if_answer": "string | number",
        "then_go_to": "number" // 跳转到的问题ID
      } | null,
      "category": "string" // 问题所属类别
    }
  ],
  "survey_ending": "string", // 结束语
  "estimated_time": "number" // 预计完成时间（分钟）
}

请确保问卷可以直接用于实际调研。`
    };
  }

  /**
   * 营销脚本生成 Prompt
   * 根据用户画像生成营销短视频脚本
   */
  static getMarketingScriptPrompt(persona, options = {}) {
    const {
      scriptType = 'video',
      duration = 30,
      targetChannel = ''
    } = options;

    const typeDescriptions = {
      video: '15-30秒的短视频脚本，包含镜头描述、台词、BGM建议',
      copy: '信息流广告文案，简洁有力',
      social: '社交媒体（微信/微博）推广文案',
      strategy: '整体营销策略文档'
    };

    return {
      role: 'user',
      content: `你是一个专业的营销策划专家。请根据以下用户画像，生成营销脚本。

## 用户画像
${JSON.stringify(persona, null, 2)}

## 脚本配置
- 脚本类型：${scriptType} - ${typeDescriptions[scriptType] || ''}
- 时长要求：${duration}秒
- 目标渠道：${targetChannel || '综合渠道'}

## 用户画像要点（请重点关注）
- 画像名称：${persona.name || persona.persona_name || '未命名'}
- 核心特征：${persona.summary || ''}
- 痛点需求：${JSON.stringify(persona.needs?.pain_points || persona.needs?.main_need || [])}
- 活跃场景：${JSON.stringify(persona.scenario?.usage_scenarios || [])}
- 行为偏好：${JSON.stringify(persona.behavioral || {})}

## 生成要求

### 视频脚本要求（15-30秒）：
1. 结构清晰：开场吸睛 → 痛点共鸣 → 产品解决 → 行动号召
2. 每个镜头有时间戳和景别说明
3. 台词简短有力，适合配音
4. 提供BGM风格建议
5. 适合抖音/快手风格

### 信息流文案要求：
1. 开头一句话吸睛
2. 中间痛点+解决方案
3. 结尾CTA（行动号召）
4. 字数控制在100字以内

### 社交文案要求：
1. 适合微信朋友圈/微博
2. 有互动性（提问或引发讨论）
3. 可附带话题标签

### 营销策略要求：
1. 人群定向说明
2. 渠道选择建议
3. 投放节奏安排
4. 预算分配建议

## 输出格式（视频脚本）
{
  "script_name": "string",
  "script_type": "${scriptType}",
  "target_duration": ${duration},
  "target_channel": "string",
  "script_content": {
    "scenes": [
      {
        "scene_number": "number",
        "time_range": "string", // 如 "0-5秒"
        "shot_type": "string", // 特写/全景/中景等
        "description": "string", // 镜头描述
        "dialogue": "string", // 台词
        "voiceover": "string", // 画外音（可选）
        "bgm_suggestion": "string", // BGM建议
        "text_overlay": "string" // 文字overlay（可选）
      }
    ]
  },
  "copy_variants": ["string"], // 可选的文案变体
  "hashtags": ["string"], // 推荐话题标签
  "target_url": "string" // 跳转链接占位
}

## 输出格式（信息流文案）
{
  "ad_headline": "string", // 吸引人的标题
  "ad_body": "string", // 正文内容
  "cta_text": "string", // 行动号召文字
  "image_suggestions": ["string"] // 图片建议
}

请直接生成可使用的营销内容。`
    };
  }

  /**
   * 产品功能建议 Prompt
   * 根据用户画像生成产品功能优化建议
   */
  static getProductSuggestionPrompt(persona, options = {}) {
    const {
      includeCompetitorAnalysis = true,
      priorityLevel = 'high'
    } = options;

    return {
      role: 'user',
      content: `你是一个专业的产品经理。请根据以下用户画像，生成产品功能建议报告。

## 用户画像
${JSON.stringify(persona, null, 2)}

## 配置
- 包含竞品分析：${includeCompetitorAnalysis ? '是' : '否'}
- 优先级重点：${priorityLevel}

## 画像核心信息
- 画像名称：${persona.name || persona.persona_name || '未命名'}
- 一句话描述：${persona.summary || ''}

### 人口统计
${JSON.stringify(persona.demographic || {}, null, 2)}

### 行为特征
${JSON.stringify(persona.behavioral || {}, null, 2)}

### 心理特征
${JSON.stringify(persona.psychological || {}, null, 2)}

### 需求痛点
${JSON.stringify(persona.needs || {}, null, 2)}

### 使用场景
${JSON.stringify(persona.scenario || {}, null, 2)}

### 营销建议
${JSON.stringify(persona.marketing_suggestions || [], null, 2)}

## 生成要求
1. 功能建议应基于画像中的痛点和需求
2. 按优先级分类：高/中/低
3. 每条建议需要包含：
   - 功能名称
   - 功能描述（做什么）
   - 用户价值（为什么做）
   - 实现复杂度（高/中/低）
   - 预期效果

4. 如果包含竞品分析，请对比市场上主要竞品的功能差异

5. 建议要具体可落地，避免空泛

## 输出格式
{
  "report_title": "string",
  "executive_summary": "string", // 执行摘要
  "user_profile_summary": {
    "key_traits": ["string"], // 关键特征
    "main_pain_points": ["string"], // 主要痛点
    "unmet_needs": ["string"] // 未满足需求
  },
  "suggestions": [
    {
      "priority": "high | medium | low",
      "feature_name": "string",
      "feature_description": "string",
      "user_value": "string",
      "implementation_complexity": "high | medium | low",
      "expected_impact": "string",
      "success_metrics": ["string"]
    }
  ],
  "competitor_analysis": {
    "summary": "string",
    "competitors": [
      {
        "name": "string",
        "strengths": ["string"],
        "weaknesses": ["string"],
        "relevant_features": ["string"]
      }
    ],
    "differentiation_opportunities": ["string"]
  },
  "implementation_roadmap": {
    "phase_1": {
      "title": "string",
      "features": ["string"],
      "timeline": "string"
    },
    "phase_2": {
      "title": "string",
      "features": ["string"],
      "timeline": "string"
    }
  },
  "confidence_score": "number" // 建议置信度 0-1
}

请生成专业、详细、可执行的产品建议报告。`
    };
  }

  /**
   * 极简无数据模式 Prompt
   * 根据自然语言指令生成行业基准画像
   */
  static getNoDataPrompt(naturalLanguageInput, options = {}) {
    const { industry = '', productCategory = '' } = options;

    return {
      role: 'user',
      content: `你是一个专业的用户画像分析师。请根据用户的自然语言描述，生成一个行业通用的用户画像基准。

## 用户需求描述
"${naturalLanguageInput}"

## 行业背景
- 行业：${industry || '未指定，将根据描述推断'}
- 产品品类：${productCategory || '未指定'}

## 画像生成要求
1. 基于行业通用知识，生成该目标人群的典型画像
2. 画像应具有代表性、可参考性
3. 包含完整五大维度：
   - 人口统计（年龄、性别、职业等）
   - 行为特征（消费习惯、偏好等）
   - 心理特征（价值观、态度等）
   - 需求特征（痛点、期望等）
   - 场景特征（使用场景、决策因素等）

4. 生成后标注"基准画像"，表示这是行业通用版本

5. 用户后续可以补充真实数据进行校准

## 输出格式
{
  "persona_name": "string",
  "is_baseline": true,
  "summary": "string",
  "source_note": "string", // 说明此画像为行业基准，需数据校准
  "demographic": {...},
  "behavioral": {...},
  "psychological": {...},
  "needs": {...},
  "scenario": {...},
  "confidence_score": 0.6, // 基准画像置信度较低
  "calibration_needed": true,
  "calibration_suggestions": ["string"] // 建议补充的数据类型
}

请直接生成可用的基准画像。`
    };
  }

  /**
   * 多轮对话迭代 Prompt
   * 用于Agent对话中优化画像
   */
  static getIterationPrompt(currentPersona, userFeedback) {
    return {
      role: 'user',
      content: `你是一个专业的用户画像分析师。用户对你的生成的画像有反馈，请根据反馈优化画像。

## 当前画像
${JSON.stringify(currentPersona, null, 2)}

## 用户反馈
"${userFeedback}"

## 迭代要求
1. 仔细理解用户的反馈内容
2. 针对性地修改画像中对应的部分
3. 保持其他部分不变
4. 解释你做了哪些修改以及为什么

## 输出格式
{
  "modified_persona": {...}, // 修改后的完整画像
  "modifications": [
    {
      "field": "string", // 修改的字段
      "old_value": "any", // 旧值
      "new_value": "any", // 新值
      "reason": "string" // 修改原因
    }
  ],
  "iteration_summary": "string" // 迭代说明
}

请基于用户反馈优化画像。`
    };
  }
}

module.exports = ExtensionPrompts;
