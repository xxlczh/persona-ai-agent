/**
 * 用户画像 Prompt 管理器
 * 提供各维度画像生成的 Prompt 模板
 */

class PersonaPrompts {
  /**
   * 人口统计维度 Prompt
   * 用于从用户数据中提取人口统计特征
   */
  static getDemographicPrompt(data) {
    return {
      role: 'user',
      content: `你是一个专业的用户画像分析师。请根据以下用户数据，分析并提取人口统计特征。

## 用户数据
${JSON.stringify(data, null, 2)}

## 分析要求
请从以下维度分析用户的人口统计特征：
1. **年龄**: 推断大致年龄段（青年/中年/老年）
2. **性别**: 从数据中推断
3. **职业**: 从数据中推断职业类型
4. **收入水平**: 推断收入范围（低/中/高）
5. **教育背景**: 推断教育程度
6. **地理位置**: 推断城市等级和地域特征
7. **家庭状况**: 推断婚姻状态、家庭规模

## 输出格式
请以JSON格式输出，字段如下：
{
  "age_group": "string", // 青年(18-30)/中年(31-50)/老年(51+)
  "gender": "string", // 男/女/未知
  "occupation": "string", // 职业类型
  "income_level": "string", // 低收入/中等收入/高收入
  "education": "string", // 学历
  "location": "string", // 地理位置
  "family_status": "string", // 家庭状况
  "confidence": "number" // 置信度 0-1
}

注意：如果某项信息无法从数据中推断，请将值设为"未知"并将confidence降低。`
    };
  }

  /**
   * 行为特征维度 Prompt
   * 用于从用户行为数据中提取行为特征
   */
  static getBehavioralPrompt(data) {
    return {
      role: 'user',
      content: `你是一个专业的用户画像分析师。请根据以下用户行为数据，分析并提取行为特征。

## 用户行为数据
${JSON.stringify(data, null, 2)}

## 分析要求
请从以下维度分析用户的行为特征：
1. **购买行为**: 购买频率、客单价、购买品类、促销敏感度
2. **浏览行为**: 浏览时长、浏览时段、浏览品类偏好
3. **搜索行为**: 搜索关键词类型、信息获取方式
4. **互动行为**: 点赞、评论、分享、收藏习惯
5. **渠道偏好**: 线上/线下偏好、平台偏好
6. **决策特征**: 决策周期、品牌忠诚度、比较行为

## 输出格式
请以JSON格式输出，字段如下：
{
  "purchase_frequency": "string", // 偶尔/经常/频繁
  "average_order_value": "string", // 低/中/高
  "category_preference": ["string"], // 偏好品类
  "promotion_sensitivity": "number", // 促销敏感度 0-1
  "browse_duration": "string", // 短/中/长
  "browse_time": "string", // 主要浏览时段
  "search_keywords": ["string"], // 常见搜索词
  "engagement_behavior": {
    "likes": "string", // 极少/偶尔/经常
    "comments": "string",
    "shares": "string",
    "favorites": "string"
  },
  "channel_preference": ["string"], // 渠道偏好
  "decision_cycle": "string", // 快速/中等/谨慎
  "brand_loyalty": "number", // 品牌忠诚度 0-1
  "confidence": "number" // 置信度 0-1
}`
    };
  }

  /**
   * 心理特征维度 Prompt
   * 用于从用户数据中分析心理特征
   */
  static getPsychologicalPrompt(data) {
    return {
      role: 'user',
      content: `你是一个专业的用户画像分析师。请根据以下用户数据，分析并提取心理特征。

## 用户数据
${JSON.stringify(data, null, 2)}

## 分析要求
请从以下维度分析用户的心理特征：
1. **价值观**: 追求品质/追求性价比/追求潮流/追求实用
2. **生活态度**: 积极进取/享受生活/稳健务实/追求自由
3. **兴趣爱好**: 兴趣爱好类型、消费娱乐偏好
4. **消费动机**: 刚需购买/改善生活/社交需求/自我奖励
5. **风险偏好**: 保守/中性/激进
6. **自我认知**: 品牌敏感度、身份认同、社交影响

## 输出格式
请以JSON格式输出，字段如下：
{
  "values": {
    "quality_pursuit": "number", // 追求品质 0-1
    "value_pursuit": "number", // 追求性价比 0-1
    "trend_pursuit": "number", // 追求潮流 0-1
    "practical_pursuit": "number" // 追求实用 0-1
  },
  "life_attitude": "string", // 积极进取/享受生活/稳健务实/追求自由
  "interests": ["string"], // 兴趣爱好
  "hobbies": ["string"], // 休闲爱好
  "consumption_motivation": ["string"], // 消费动机
  "risk_preference": "string", // 保守/中性/激进
  "brand_sensitivity": "number", // 品牌敏感度 0-1
  "social_influence": "number", // 社交影响度 0-1
  "confidence": "number" // 置信度 0-1
}`
    };
  }

  /**
   * 需求特征维度 Prompt
   * 用于从用户数据中分析需求特征
   */
  static getNeedsPrompt(data) {
    return {
      role: 'user',
      content: `你是一个专业的用户画像分析师。请根据以下用户数据，分析并提取需求特征。

## 用户数据
${JSON.stringify(data, null, 2)}

## 分析要求
请从以下维度分析用户的需求特征：
1. **功能需求**: 核心功能需求、附加功能需求
2. **体验需求**: 服务体验、购物体验、使用体验
3. **情感需求**: 情感诉求、心理满足
4. **价格敏感度**: 对价格的敏感程度
5. **痛点**: 当前未满足的需求、使用中的困扰
6. **期望**: 用户期望的改进方向

## 输出格式
请以JSON格式输出，字段如下：
{
  "functional_needs": ["string"], // 功能需求
  "experience_needs": {
    "service_expectation": "string", // 服务期望
    "shopping_expectation": "string", // 购物期望
    "usage_expectation": "string" // 使用期望
  },
  "emotional_needs": ["string"], // 情感需求
  "price_sensitivity": "number", // 价格敏感度 0-1
  "pain_points": ["string"], // 痛点
  "expectations": ["string"], // 期望
  "confidence": "number" // 置信度 0-1
}`
    };
  }

  /**
   * 场景特征维度 Prompt
   * 用于从用户数据中分析场景特征
   */
  static getScenarioPrompt(data) {
    return {
      role: 'user',
      content: `你是一个专业的用户画像分析师。请根据以下用户数据，分析并提取场景特征。

## 用户数据
${JSON.stringify(data, null, 2)}

## 分析要求
请从以下维度分析用户的场景特征：
1. **使用场景**: 主要使用场景、次要使用场景
2. **时间特征**: 高峰使用时段、季节性特征
3. **空间特征**: 使用地点偏好、移动性特征
4. **决策场景**: 购买决策场景、影响决策的因素
5. **社交场景**: 社交分享场景、群体消费特征
6. **特殊场景**: 节日/活动/突发事件的影响

## 输出格式
请以JSON格式输出，字段如下：
{
  "usage_scenarios": {
    "primary": "string", // 主要场景
    "secondary": ["string"] // 次要场景
  },
  "time_features": {
    "peak_hours": ["string"], // 高峰时段
    "seasonality": "string" // 季节性特征
  },
  "spatial_features": {
    "location_preference": ["string"], // 地点偏好
    "mobility": "string" // 移动性 高/中/低
  },
  "decision_scenarios": {
    "typical_decision": "string", // 典型决策场景
    "influence_factors": ["string"] // 影响因素
  },
  "social_scenarios": {
    "share_preference": "string", // 分享偏好
    "group_consumption": "string" // 群体消费特征
  },
  "special_scenarios": ["string"], // 特殊场景
  "confidence": "number" // 置信度 0-1
}`
    };
  }

  /**
   * 综合画像生成 Prompt
   * 用于生成完整的用户画像
   */
  static getComprehensivePrompt(demographic, behavioral, psychological, needs, scenario) {
    return {
      role: 'user',
      content: `你是一个专业的用户画像分析师。请根据以下各个维度的分析结果，综合生成完整的用户画像。

## 人口统计特征
${JSON.stringify(demographic, null, 2)}

## 行为特征
${JSON.stringify(behavioral, null, 2)}

## 心理特征
${JSON.stringify(psychological, null, 2)}

## 需求特征
${JSON.stringify(needs, null, 2)}

## 场景特征
${JSON.stringify(scenario, null, 2)}

## 输出要求
请综合以上所有维度信息，生成一个完整的、结构化的用户画像。输出格式如下：

{
  "persona_name": "string", // 画像名称（如：都市白领、年轻妈妈等）
  "summary": "string", // 一句话描述
  "demographic": {
    // 人口统计特征
  },
  "behavioral": {
    // 行为特征
  },
  "psychological": {
    // 心理特征
  },
  "needs": {
    // 需求特征
  },
  "scenario": {
    // 场景特征
  },
  "personality_tags": ["string"], // 性格标签
  "communication_style": "string", // 沟通风格建议
  "marketing_suggestions": ["string"], // 营销建议
  "quality_score": {
    "completeness": "number", // 完整性评分 0-1
    "consistency": "number", // 一致性评分 0-1
    "overall": "number" // 综合评分 0-1
  }
}

请确保画像的一致性和逻辑性，所有维度信息应该相互呼应。`
    };
  }

  /**
   * 自然语言画像生成 Prompt（极简模式）
   * 用于直接从自然语言描述生成用户画像
   */
  static getNaturalLanguagePrompt(naturalLanguageInput, config = {}) {
    const { industry, productDescription } = config;

    const industryContext = {
      '游戏': '游戏行业核心特征：注重玩法创新、社交开黑、氪金点与平衡性、角色造型与技能特效、赛事与排名系统。手游用户碎片化时间多，端游用户追求沉浸体验。',
      '美妆护肤': '美妆护肤行业核心特征：注重成分功效、肤质适配、性价比、口碑种草、包装颜值、季节性与节日促销。决策受KOL和社区评测影响大。',
      '3C数码': '3C数码行业核心特征：注重性能参数、性价比、评测对比、售后保障、新品发布节奏、设备兼容性。男性用户占比高，决策理性。',
      '电商零售': '电商零售行业核心特征：注重价格优惠、物流速度、正品保障、用户评价、促销活动、品类丰富度。冲动消费和节庆消费明显。',
      '教育学习': '教育学习行业核心特征：注重师资力量、课程效果、学习氛围、课后辅导、价格敏感度、证书认证。家长决策与用户分离现象明显。',
      '职场效率工具': '职场效率工具行业核心特征：注重效率提升、学习成本、协作能力、数据安全、定价模式（订阅制）、集成生态。决策者与使用者常不同。',
      '健康健身': '健康健身行业核心特征：注重效果反馈、专业指导、便捷性、隐私性、社群激励、产品安全性。健身习惯养成难，流失率高。',
      '母婴亲子': '母婴亲子行业核心特征：注重安全性、品质感、便利性、口碑推荐、年龄适配、亲子互动。决策者多为妈妈，注重专家建议。',
      '内容社区': '内容社区行业核心特征：注重内容质量、创作者生态、社区氛围、互动激励、内容分发算法、变现能力。内容消费碎片化，创作门槛重要。',
      '金融理财': '金融理财行业核心特征：注重安全性、收益稳定性、专业门槛、风险控制、便捷性、监管合规。用户风险偏好差异大，学习成本高。',
      '旅游出行': '旅游出行行业核心特征：注重目的地吸引力、价格合理性、便利性、评价口碑、行程灵活性、突发事件应对。决策周期长，复购率低。',
      '其他': '通用消费品特征：注重品质、价格、便利性、口碑。用户群体广泛，需求多元。'
    };

    const industryInfo = industryContext[industry] || industryContext['其他'];
    const productInfo = productDescription ? `\n## 产品定位\n${productDescription}` : '';

    return {
      role: 'user',
      content: `你是一个专业的用户画像分析师。根据以下信息生成精准的用户画像。

## 行业背景
${industryInfo}${productInfo}

## 用户需求描述
${naturalLanguageInput}

## 画像要求
请结合行业特征和产品描述，生成一个具有行业特色、精准可落地用户画像。

【重要】你必须且只能输出一个完整的JSON对象，不要输出任何其他文字、解释、markdown格式或代码块标记。

JSON格式示例：
{"persona_name":"年轻游戏爱好者","summary":"描述...","demographic":{"age_group":"20-30岁",...},...}

必须包含以下所有字段：
{
  "persona_name": "画像名称（如：硬核竞技型玩家、精致妈妈等）",
  "summary": "3-4句话的用户特征描述",
  "demographic": {"age_group":"年龄段","gender":"性别","occupation":"职业","income_level":"收入水平","education":"学历","location":"地区"},
  "behavioral": {"shopping_habit":"消费习惯","online_preference":"线上偏好","brand_loyalty":"品牌忠诚度","price_sensitivity":"价格敏感度","decision_factor":"决策因素"},
  "psychological": {"values":"价值观","motivation":"动机","pain_points":"痛点","aspirations":"愿望/追求"},
  "needs": {"main_need":"核心需求","sub_needs":["子需求1","子需求2"],"unmet_needs":"未满足需求"},
  "scenario": {"usage_scene":"使用场景","interaction_channel":"交互渠道","content_preference":"内容偏好"},
  "tags": ["标签1","标签2",...],
  "communication_style": "沟通风格建议",
  "marketing_suggestions": ["建议1","建议2",...]
}`
    };
  }

  /**
   * 快速画像生成 Prompt
   * 用于直接从原始数据生成简化版用户画像
   */
  static getQuickPrompt(data) {
    return {
      role: 'user',
      content: `你是一个专业的用户画像分析师。请根据以下用户原始数据，快速生成用户画像。

## 用户原始数据
${JSON.stringify(data, null, 2)}

## 输出要求
请直接生成一个简洁但完整的用户画像，包含以下核心维度：

{
  "persona_name": "string", // 画像名称
  "summary": "string", // 2-3句话的用户特征描述
  "demographics": {
    "age_group": "string",
    "gender": "string",
    "occupation": "string",
    "income_level": "string",
    "location": "string"
  },
  "behavioral": {
    "shopping_habit": "string",
    "online_preference": "string",
    "brand_loyalty": "string"
  },
  "psychological": {
    "values": "string",
    "motivation": "string"
  },
  "needs": {
    "main_need": "string",
    "pain_points": ["string"]
  },
  "tags": ["string"], // 5-8个标签
  "marketing_tips": "string" // 一句话营销建议
}

请确保画像逻辑清晰、标签准确。`
    };
  }
}

module.exports = PersonaPrompts;
