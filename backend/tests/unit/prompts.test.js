/**
 * Prompt 测试用例
 */
const PersonaPrompts = require('../../src/prompts/PersonaPrompts');

describe('PersonaPrompts', () => {
  // 模拟用户数据
  const mockUserData = {
    name: '张三',
    age: 28,
    occupation: '互联网产品经理',
    location: '北京',
    income: '20k-30k',
    education: '本科',
    purchase_history: [
      { item: 'iPhone 15 Pro', price: 8999, date: '2024-01-15' },
      { item: 'AirPods Pro', price: 1999, date: '2024-01-20' },
      { item: 'Apple Watch', price: 3299, date: '2024-02-01' }
    ],
    browse_history: [
      { category: '数码', duration: 30 },
      { category: '健身', duration: 15 },
      { category: '旅游', duration: 20 }
    ],
    search_keywords: ['iPhone', '蓝牙耳机', '智能手表', '健身课程'],
    posts: [
      { type: 'tech', likes: 150 },
      { type: 'lifestyle', likes: 80 }
    ]
  };

  describe('getDemographicPrompt', () => {
    test('should generate demographic prompt with correct structure', () => {
      const prompt = PersonaPrompts.getDemographicPrompt(mockUserData);

      expect(prompt).toHaveProperty('role', 'user');
      expect(prompt).toHaveProperty('content');
      expect(prompt.content).toContain('人口统计特征');
      expect(prompt.content).toContain('age_group');
      expect(prompt.content).toContain('gender');
      expect(prompt.content).toContain('occupation');
      expect(prompt.content).toContain('confidence');
    });

    test('should include data in prompt content', () => {
      const prompt = PersonaPrompts.getDemographicPrompt(mockUserData);

      expect(prompt.content).toContain('张三');
      expect(prompt.content).toContain('北京');
      expect(prompt.content).toContain('产品经理');
    });
  });

  describe('getBehavioralPrompt', () => {
    test('should generate behavioral prompt with correct structure', () => {
      const prompt = PersonaPrompts.getBehavioralPrompt(mockUserData);

      expect(prompt).toHaveProperty('role', 'user');
      expect(prompt.content).toContain('行为特征');
      expect(prompt.content).toContain('purchase_frequency');
      expect(prompt.content).toContain('promotion_sensitivity');
      expect(prompt.content).toContain('brand_loyalty');
    });
  });

  describe('getPsychologicalPrompt', () => {
    test('should generate psychological prompt with correct structure', () => {
      const prompt = PersonaPrompts.getPsychologicalPrompt(mockUserData);

      expect(prompt).toHaveProperty('role', 'user');
      expect(prompt.content).toContain('心理特征');
      expect(prompt.content).toContain('values');
      expect(prompt.content).toContain('life_attitude');
      expect(prompt.content).toContain('interests');
    });
  });

  describe('getNeedsPrompt', () => {
    test('should generate needs prompt with correct structure', () => {
      const prompt = PersonaPrompts.getNeedsPrompt(mockUserData);

      expect(prompt).toHaveProperty('role', 'user');
      expect(prompt.content).toContain('需求特征');
      expect(prompt.content).toContain('functional_needs');
      expect(prompt.content).toContain('pain_points');
      expect(prompt.content).toContain('price_sensitivity');
    });
  });

  describe('getScenarioPrompt', () => {
    test('should generate scenario prompt with correct structure', () => {
      const prompt = PersonaPrompts.getScenarioPrompt(mockUserData);

      expect(prompt).toHaveProperty('role', 'user');
      expect(prompt.content).toContain('场景特征');
      expect(prompt.content).toContain('usage_scenarios');
      expect(prompt.content).toContain('time_features');
      expect(prompt.content).toContain('decision_scenarios');
    });
  });

  describe('getComprehensivePrompt', () => {
    test('should generate comprehensive prompt with all dimensions', () => {
      const demographic = { age_group: '青年', gender: '男' };
      const behavioral = { purchase_frequency: '经常' };
      const psychological = { values: { quality_pursuit: 0.8 } };
      const needs = { main_need: '高品质' };
      const scenario = { usage_scenarios: { primary: '工作' } };

      const prompt = PersonaPrompts.getComprehensivePrompt(
        demographic,
        behavioral,
        psychological,
        needs,
        scenario
      );

      expect(prompt).toHaveProperty('role', 'user');
      expect(prompt.content).toContain('人口统计特征');
      expect(prompt.content).toContain('行为特征');
      expect(prompt.content).toContain('心理特征');
      expect(prompt.content).toContain('需求特征');
      expect(prompt.content).toContain('场景特征');
      expect(prompt.content).toContain('persona_name');
      expect(prompt.content).toContain('marketing_suggestions');
    });
  });

  describe('getQuickPrompt', () => {
    test('should generate quick prompt for rapid persona generation', () => {
      const prompt = PersonaPrompts.getQuickPrompt(mockUserData);

      expect(prompt).toHaveProperty('role', 'user');
      expect(prompt.content).toContain('快速生成用户画像');
      expect(prompt.content).toContain('persona_name');
      expect(prompt.content).toContain('summary');
      expect(prompt.content).toContain('tags');
      expect(prompt.content).toContain('marketing_tips');
    });
  });
});
